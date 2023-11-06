import { PartialType } from '@nestjs/swagger';
import { CreateCircuitViemDto } from './create-circuit-viem.dto';

export class UpdateCircuitViemDto extends PartialType(CreateCircuitViemDto) {}
