const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = await hre.ethers.provider.getNetwork();

  console.log("\n🚀 Deploying TicketChain contracts");
  console.log("   Network:", network.name, `(#${network.chainId})`);
  console.log("   Deployer:", deployer.address);

  // Deploy TicketNFT first. We temporarily set the factory to the deployer
  // and update it to the TicketFactory address once it is deployed.
  const ticketNftArgs = [
    "TicketChain NFT",
    "TCNFT",
    deployer.address,
    hre.ethers.ZeroAddress,
    0,
  ];

  console.log("\n🖼  Deploying TicketNFT...");
  const ticketNFT = await hre.ethers.deployContract("TicketNFT", ticketNftArgs);
  await ticketNFT.waitForDeployment();
  const ticketNftAddress = await ticketNFT.getAddress();
  console.log("   TicketNFT deployed at:", ticketNftAddress);

  // Deploy TicketFactory with the TicketNFT address
  console.log("\n🏭 Deploying TicketFactory...");
  const ticketFactory = await hre.ethers.deployContract("TicketFactory", [
    ticketNftAddress,
  ]);
  await ticketFactory.waitForDeployment();
  const ticketFactoryAddress = await ticketFactory.getAddress();
  console.log("   TicketFactory deployed at:", ticketFactoryAddress);

  // Update NFT contract so only the factory can mint/validate
  console.log("   ➕ Setting TicketNFT factory to TicketFactory...");
  const setFactoryTx = await ticketNFT.setFactory(ticketFactoryAddress);
  await setFactoryTx.wait();
  console.log("   ✔ TicketNFT factory updated");

  // Deploy TicketMarketplace which also depends on the NFT address
  console.log("\n🏪 Deploying TicketMarketplace...");
  const ticketMarketplace = await hre.ethers.deployContract(
    "TicketMarketplace",
    [ticketNftAddress]
  );
  await ticketMarketplace.waitForDeployment();
  const ticketMarketplaceAddress = await ticketMarketplace.getAddress();
  console.log("   TicketMarketplace deployed at:", ticketMarketplaceAddress);

  console.log("\n✅ Deployment complete! Summary:");
  console.log("   TicketNFT:        ", ticketNftAddress);
  console.log("   TicketFactory:    ", ticketFactoryAddress);
  console.log("   TicketMarketplace:", ticketMarketplaceAddress);
  console.log();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
