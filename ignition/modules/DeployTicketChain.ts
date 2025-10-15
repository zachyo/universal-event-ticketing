import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { ethers } from "hardhat";

// This module deploys the entire TicketChain system.
const TicketChainModule = buildModule("TicketChainModule", (m) => {
  // Parameters for deployment, can be customized.
  const nftName = m.getParameter("nftName", "TicketChain NFT");
  const nftSymbol = m.getParameter("nftSymbol", "TCNFT");
  
  // The deployer address will be the initial owner and factory authority.
  const deployer = m.getAccount(0);

  // 1. Deploy the TicketNFT contract.
  // The deployer is set as the initial factory to authorize the call to setFactory later.
  const ticketNFT = m.contract("TicketNFT", [
    nftName,
    nftSymbol,
    deployer, // Initial factory is the deployer itself
    ethers.ZeroAddress, // No default royalty receiver
    0, // No default royalty bps
  ]);

  // 2. Deploy the TicketFactory, providing the address of the newly deployed TicketNFT.
  const ticketFactory = m.contract("TicketFactory", [ticketNFT]);

  // 3. Deploy the TicketMarketplace, also providing the TicketNFT address.
  const ticketMarketplace = m.contract("TicketMarketplace", [ticketNFT]);

  // 4. Set the real TicketFactory as the authorized factory on the TicketNFT contract.
  // This transfers the minting and validation authority from the deployer to the factory contract.
  m.call(ticketNFT, "setFactory", [ticketFactory]);

  // Return the deployed contract instances for easy access.
  return { ticketNFT, ticketFactory, ticketMarketplace };
});

export default TicketChainModule;
