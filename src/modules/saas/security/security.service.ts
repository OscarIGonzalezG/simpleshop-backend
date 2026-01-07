import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlockedIp } from './entities/blocked-ip.entity';
import { LoggerService } from '../../../core/logger/logger.service';

@Injectable()
export class SecurityService {
  private ipCache = new Set<string>();

  constructor(
    @InjectRepository(BlockedIp)
    private readonly blockedIpRepo: Repository<BlockedIp>,
    private readonly logger: LoggerService,
  ) {
    this.refreshCache();
  }

  async refreshCache() {
    const all = await this.blockedIpRepo.find();
    this.ipCache = new Set(all.map(b => b.ip));
  }

  async blockIp(ip: string, reason: string, blockedBy: string) {
    if (this.ipCache.has(ip)) {
      throw new BadRequestException('Esta IP ya está bloqueada');
    }

    const newBlock = this.blockedIpRepo.create({ ip, reason, blockedBy });
    await this.blockedIpRepo.save(newBlock);
    
    this.ipCache.add(ip);
    this.logger.security('IP_BLOCK', `IP Bloqueada manualmente: ${ip} por ${blockedBy}`);
    
    return newBlock;
  }

  async unblockIp(ip: string, unblockedBy: string) {
    const entry = await this.blockedIpRepo.findOne({ where: { ip } });
    if (!entry) throw new BadRequestException('Esta IP no estaba bloqueada');

    await this.blockedIpRepo.remove(entry);
    
    this.ipCache.delete(ip);
    this.logger.security('IP_UNBLOCK', `IP Desbloqueada: ${ip} por ${unblockedBy}`);
    
    return { success: true };
  }

  isBlocked(ip: string): boolean {
    return this.ipCache.has(ip);
  }
  
  async findAll() {
      return this.blockedIpRepo.find({ order: { blockedAt: 'DESC' } });
  }
}