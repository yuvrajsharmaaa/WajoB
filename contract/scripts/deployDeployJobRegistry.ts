import { toNano } from '@ton/core';
import { DeployJobRegistry } from '../wrappers/DeployJobRegistry';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const deployJobRegistry = provider.open(DeployJobRegistry.createFromConfig({}, await compile('DeployJobRegistry')));

    await deployJobRegistry.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(deployJobRegistry.address);

    // run methods on `deployJobRegistry`
}
