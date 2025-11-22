import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TonClient, Address } from '@ton/ton';
import { getHttpEndpoint } from '@orbs-network/ton-access';

@Injectable()
export class TonClientService {
  private readonly logger = new Logger(TonClientService.name);
  private client: TonClient;
  private readonly network: string;
  private readonly apiUrl: string;

  // Contract addresses
  private jobRegistryAddress: Address;
  private escrowAddress: Address;
  private reputationAddress: Address;

  constructor(private configService: ConfigService) {
    this.network = this.configService.get('TON_NETWORK', 'testnet');
    this.apiUrl = this.configService.get('TON_TONCENTER_API_URL');
    
    this.initializeClient();
    this.initializeContracts();
  }

  private async initializeClient() {
    try {
      // Use custom API URL if provided, otherwise use TON Access
      let endpoint: string;
      
      if (this.apiUrl) {
        endpoint = this.apiUrl;
      } else {
        endpoint = await getHttpEndpoint({
          network: this.network === 'mainnet' ? 'mainnet' : 'testnet',
        });
      }

      this.client = new TonClient({ endpoint });
      this.logger.log(`TON client initialized for ${this.network}`);
    } catch (error) {
      this.logger.error(`Failed to initialize TON client: ${error.message}`);
      throw error;
    }
  }

  private initializeContracts() {
    try {
      const jobRegistryAddr = this.configService.get('CONTRACT_JOB_REGISTRY');
      const escrowAddr = this.configService.get('CONTRACT_ESCROW');
      const reputationAddr = this.configService.get('CONTRACT_REPUTATION');

      if (jobRegistryAddr) {
        this.jobRegistryAddress = Address.parse(jobRegistryAddr);
      }
      if (escrowAddr) {
        this.escrowAddress = Address.parse(escrowAddr);
      }
      if (reputationAddr) {
        this.reputationAddress = Address.parse(reputationAddr);
      }

      this.logger.log('Contract addresses initialized');
    } catch (error) {
      this.logger.warn(`Contract initialization incomplete: ${error.message}`);
    }
  }

  getClient(): TonClient {
    return this.client;
  }

  getJobRegistryAddress(): Address {
    return this.jobRegistryAddress;
  }

  getEscrowAddress(): Address {
    return this.escrowAddress;
  }

  getReputationAddress(): Address {
    return this.reputationAddress;
  }

  /**
   * Get contract state
   */
  async getContractState(address: Address) {
    try {
      const state = await this.client.getContractState(address);
      return state;
    } catch (error) {
      this.logger.error(`Failed to get contract state: ${error.message}`);
      throw error;
    }
  }

  /**
   * Run get method on contract
   */
  async runGetMethod(
    address: Address,
    method: string,
    stack: any[] = [],
  ): Promise<any> {
    try {
      const result = await this.client.runMethod(address, method, stack);
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to run get method ${method}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get transaction history for an address
   */
  async getTransactions(address: Address, limit = 10) {
    try {
      const transactions = await this.client.getTransactions(address, {
        limit,
      });
      return transactions;
    } catch (error) {
      this.logger.error(`Failed to get transactions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Parse transaction data
   */
  parseTransaction(transaction: any) {
    try {
      // Extract relevant transaction data
      const { hash, lt, now, inMessage, outMessages } = transaction;

      return {
        hash: hash().toString('hex'),
        logicalTime: lt,
        timestamp: now,
        inMessage: inMessage ? this.parseMessage(inMessage) : null,
        outMessages: outMessages.map((msg) => this.parseMessage(msg)),
      };
    } catch (error) {
      this.logger.error(`Failed to parse transaction: ${error.message}`);
      return null;
    }
  }

  /**
   * Parse message data
   */
  private parseMessage(message: any) {
    try {
      const body = message.body;
      if (!body) return null;

      // Parse operation code (first 32 bits)
      const slice = body.beginParse();
      const op = slice.loadUint(32);

      return {
        source: message.info.src?.toString(),
        destination: message.info.dest?.toString(),
        value: message.info.value.coins.toString(),
        op: `0x${op.toString(16)}`,
        body: slice.toString(),
      };
    } catch (error) {
      this.logger.error(`Failed to parse message: ${error.message}`);
      return null;
    }
  }

  /**
   * Check if address is valid
   */
  isValidAddress(address: string): boolean {
    try {
      Address.parse(address);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Format TON amount from nanotons
   */
  fromNano(nanotons: string | number): string {
    const amount = BigInt(nanotons);
    return (Number(amount) / 1e9).toFixed(9);
  }

  /**
   * Convert TON amount to nanotons
   */
  toNano(tons: string | number): string {
    const amount = Number(tons) * 1e9;
    return Math.floor(amount).toString();
  }
}
