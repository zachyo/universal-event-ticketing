
import {
    time,
    loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("TicketChain", function () {
    async function deployTicketChainFixture() {
        const [owner, organizer, buyer1, buyer2] = await ethers.getSigners();

        // Deploy TicketNFT
        const TicketNFT = await ethers.getContractFactory("TicketNFT");
        // We deploy the NFT contract with the owner as the initial factory, 
        // then transfer ownership to the actual factory contract.
        const ticketNFT = await TicketNFT.deploy("TicketChain NFT", "TCNFT", owner.address, ethers.ZeroAddress, 0);

        // Deploy TicketFactory
        const TicketFactory = await ethers.getContractFactory("TicketFactory");
        const ticketFactory = await TicketFactory.deploy(await ticketNFT.getAddress());

        // Deploy TicketMarketplace
        const TicketMarketplace = await ethers.getContractFactory("TicketMarketplace");
        const ticketMarketplace = await TicketMarketplace.deploy(await ticketNFT.getAddress());

        // Set the factory address in TicketNFT to the actual TicketFactory contract
        await ticketNFT.setFactory(await ticketFactory.getAddress());

        return { ticketNFT, ticketFactory, ticketMarketplace, owner, organizer, buyer1, buyer2 };
    }

    describe("Deployment", function () {
        it("Should set the right owner and factory", async function () {
            const { ticketNFT, ticketFactory, ticketMarketplace, owner } = await loadFixture(deployTicketChainFixture);

            expect(await ticketNFT.owner()).to.equal(owner.address);
            expect(await ticketFactory.owner()).to.equal(owner.address);
            expect(await ticketMarketplace.owner()).to.equal(owner.address);
            expect(await ticketNFT.factory()).to.equal(await ticketFactory.getAddress());
        });
    });

    describe("Event and Ticket Management", function () {
        it("Should allow an organizer to create an event and add ticket types", async function () {
            const { ticketFactory, organizer } = await loadFixture(deployTicketChainFixture);
            const startTime = (await time.latest()) + 60;
            const endTime = startTime + 86400; // 1 day

            await expect(ticketFactory.connect(organizer).createEvent(
                "Test Event",
                "A cool event",
                startTime,
                endTime,
                "Test Venue",
                "ipfs://imagehash",
                100,
                500 // 5% royalty
            )).to.emit(ticketFactory, "EventCreated").withArgs(1, organizer.address, "Test Event", startTime, endTime, 100, 500);

            const eventData = await ticketFactory.events(1);
            expect(eventData.name).to.equal("Test Event");
            expect(eventData.organizer).to.equal(organizer.address);

            await expect(ticketFactory.connect(organizer).addTicketType(1, "General Admission", ethers.parseEther("0.1"), 50))
                .to.emit(ticketFactory, "TicketTypeAdded").withArgs(1, 0, "General Admission", ethers.parseEther("0.1"), 50);

            const ticketTypes = await ticketFactory.getTicketTypes(1);
            expect(ticketTypes.length).to.equal(1);
            expect(ticketTypes[0].name).to.equal("General Admission");
        });
    });

    describe("Primary Sale (Ticket Purchase)", function () {
        it("Should allow a buyer to purchase a ticket", async function () {
            const { ticketFactory, ticketNFT, organizer, buyer1 } = await loadFixture(deployTicketChainFixture);
            const startTime = (await time.latest()) + 60;
            const endTime = startTime + 86400;

            await ticketFactory.connect(organizer).createEvent("Test Event", "Desc", startTime, endTime, "Venue", "ipfs://", 100, 0);
            await ticketFactory.connect(organizer).addTicketType(1, "GA", ethers.parseEther("0.1"), 50);

            await time.increaseTo(startTime);

            await expect(ticketFactory.connect(buyer1).purchaseTicket(1, 0, { value: ethers.parseEther("0.1") }))
                .to.emit(ticketNFT, "TicketMinted")
                .withArgs(1, 1, 0, buyer1.address, ethers.parseEther("0.1"), "chain:31337", "");

            expect(await ticketNFT.ownerOf(1)).to.equal(buyer1.address);
            const ticketDetails = await ticketNFT.ticketDetails(1);
            expect(ticketDetails.originalOwner).to.equal(buyer1.address);
        });

        it("Should fail if payment is incorrect", async function () {
            const { ticketFactory, organizer, buyer1 } = await loadFixture(deployTicketChainFixture);
            const startTime = (await time.latest()) + 60;
            const endTime = startTime + 86400;

            await ticketFactory.connect(organizer).createEvent("Test Event", "Desc", startTime, endTime, "Venue", "ipfs://", 100, 0);
            await ticketFactory.connect(organizer).addTicketType(1, "GA", ethers.parseEther("0.1"), 50);

            await time.increaseTo(startTime);

            await expect(ticketFactory.connect(buyer1).purchaseTicket(1, 0, { value: ethers.parseEther("0.05") }))
                .to.be.revertedWithCustomError(ticketFactory, "IncorrectPayment");
        });
    });

    describe("Secondary Marketplace", function () {
        let fixture: any;
        const ticketPrice = ethers.parseEther("0.1");
        const listingPrice = ethers.parseEther("0.2");
        const royaltyBps = 1000; // 10%

        beforeEach(async () => {
            fixture = await loadFixture(deployTicketChainFixture);
            const { ticketFactory, ticketNFT, organizer, buyer1 } = fixture;
            const startTime = (await time.latest()) + 60;
            const endTime = startTime + 86400;

            await ticketFactory.connect(organizer).createEvent("Test Event", "Desc", startTime, endTime, "Venue", "ipfs://", 100, royaltyBps);
            await ticketFactory.connect(organizer).addTicketType(1, "GA", ticketPrice, 50);
            await time.increaseTo(startTime);
            await ticketFactory.connect(buyer1).purchaseTicket(1, 0, { value: ticketPrice });
            await ticketNFT.connect(buyer1).approve(fixture.ticketMarketplace.getAddress(), 1);
        });

        it("Should allow a ticket owner to list a ticket", async function () {
            const { ticketMarketplace, buyer1 } = fixture;
            await expect(ticketMarketplace.connect(buyer1).listTicket(1, listingPrice))
                .to.emit(ticketMarketplace, "TicketListed").withArgs(1, 1, buyer1.address, listingPrice);
            
            const listing = await ticketMarketplace.listings(1);
            expect(listing.seller).to.equal(buyer1.address);
            expect(listing.price).to.equal(listingPrice);
            expect(listing.active).to.be.true;
        });

        it("Should allow a buyer to purchase a listed ticket and pay royalties", async function () {
            const { ticketMarketplace, ticketNFT, organizer, buyer1, buyer2 } = fixture;
            await ticketMarketplace.connect(buyer1).listTicket(1, listingPrice);

            const sellerInitialBalance = await ethers.provider.getBalance(buyer1.address);
            const organizerInitialBalance = await ethers.provider.getBalance(organizer.address);

            await expect(ticketMarketplace.connect(buyer2).buyTicket(1, { value: listingPrice }))
                .to.emit(ticketMarketplace, "TicketPurchased");

            expect(await ticketNFT.ownerOf(1)).to.equal(buyer2.address);
            
            const royaltyAmount = (listingPrice * BigInt(royaltyBps)) / 10000n;
            const sellerAmount = listingPrice - royaltyAmount;

            const sellerFinalBalance = await ethers.provider.getBalance(buyer1.address);
            const organizerFinalBalance = await ethers.provider.getBalance(organizer.address);

            expect(sellerFinalBalance).to.equal(sellerInitialBalance + sellerAmount);
            expect(organizerFinalBalance).to.equal(organizerInitialBalance + royaltyAmount);

            const listing = await ticketMarketplace.listings(1);
            expect(listing.active).to.be.false;
        });

        it("Should allow a seller to cancel a listing", async function () {
            const { ticketMarketplace, ticketNFT, buyer1 } = fixture;
            await ticketMarketplace.connect(buyer1).listTicket(1, listingPrice);

            await expect(ticketMarketplace.connect(buyer1).cancelListing(1))
                .to.emit(ticketMarketplace, "ListingCanceled").withArgs(1, 1);

            expect(await ticketNFT.ownerOf(1)).to.equal(buyer1.address);
            const listing = await ticketMarketplace.listings(1);
            expect(listing.active).to.be.false;
        });
    });

    describe("Ticket Validation and Fund Withdrawal", function () {
        it("Should allow the organizer to validate a ticket, preventing transfer", async function () {
            const { ticketFactory, ticketNFT, organizer, buyer1, buyer2 } = await loadFixture(deployTicketChainFixture);
            const startTime = (await time.latest()) + 60;
            const endTime = startTime + 86400;
            const eventId = 1;
            const tokenId = 1;

            await ticketFactory.connect(organizer).createEvent("Test Event", "Desc", startTime, endTime, "Venue", "ipfs://", 100, 0);
            await ticketFactory.connect(organizer).addTicketType(eventId, "GA", ethers.parseEther("0.1"), 50);
            await time.increaseTo(startTime);
            await ticketFactory.connect(buyer1).purchaseTicket(eventId, 0, { value: ethers.parseEther("0.1") });

            // A non-organizer cannot validate the ticket
            await expect(ticketFactory.connect(buyer1).validateTicket(eventId, tokenId))
                .to.be.revertedWithCustomError(ticketFactory, "NotOrganizer");

            // The organizer can validate the ticket
            await expect(ticketFactory.connect(organizer).validateTicket(eventId, tokenId))
                .to.emit(ticketNFT, "TicketValidated");

            const ticketDetails = await ticketNFT.ticketDetails(tokenId);
            expect(ticketDetails.used).to.be.true;

            // A used ticket cannot be transferred
            await expect(ticketNFT.connect(buyer1).transferFrom(buyer1.address, buyer2.address, tokenId))
                .to.be.revertedWithCustomError(ticketNFT, "TicketUsed");
        });

        it("Should allow the organizer to withdraw funds", async function () {
            const { ticketFactory, organizer, buyer1 } = await loadFixture(deployTicketChainFixture);
            const startTime = (await time.latest()) + 60;
            const endTime = startTime + 86400;
            const price = ethers.parseEther("0.1");

            await ticketFactory.connect(organizer).createEvent("Test Event", "Desc", startTime, endTime, "Venue", "ipfs://", 100, 0);
            await ticketFactory.connect(organizer).addTicketType(1, "GA", price, 50);
            await time.increaseTo(startTime);
            await ticketFactory.connect(buyer1).purchaseTicket(1, 0, { value: price });

            const organizerInitialBalance = await ethers.provider.getBalance(organizer.address);
            
            const tx = await ticketFactory.connect(organizer).withdrawFunds(1, organizer.address);
            const receipt = await tx.wait();
            const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

            const organizerFinalBalance = await ethers.provider.getBalance(organizer.address);

            expect(organizerFinalBalance).to.equal(organizerInitialBalance + price - gasUsed);
        });
    });
});
