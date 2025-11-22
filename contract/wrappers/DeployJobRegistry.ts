import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type DeployJobRegistryConfig = {};

export function deployJobRegistryConfigToCell(config: DeployJobRegistryConfig): Cell {
    return beginCell().endCell();
}

export class DeployJobRegistry implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new DeployJobRegistry(address);
    }

    static createFromConfig(config: DeployJobRegistryConfig, code: Cell, workchain = 0) {
        const data = deployJobRegistryConfigToCell(config);
        const init = { code, data };
        return new DeployJobRegistry(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }
}
