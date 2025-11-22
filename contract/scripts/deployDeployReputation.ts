import { toNano } from '@ton/core';
import { DeployReputation } from '../wrappers/DeployReputation';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const deployReputation = provider.open(
        DeployReputation.createFromConfig(
            {
                id: Math.floor(Math.random() * 10000),
                counter: 0,
            },
            await compile('DeployReputation')
        )
    );

    await deployReputation.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(deployReputation.address);

    console.log('ID', await deployReputation.getID());
}
