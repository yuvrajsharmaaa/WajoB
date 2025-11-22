import { toNano } from '@ton/core';
import { DeployEscrow } from '../wrappers/DeployEscrow';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const deployEscrow = provider.open(
        DeployEscrow.createFromConfig(
            {
                id: Math.floor(Math.random() * 10000),
                counter: 0,
            },
            await compile('DeployEscrow')
        )
    );

    await deployEscrow.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(deployEscrow.address);

    console.log('ID', await deployEscrow.getID());
}
