import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../repositories/user.repository';
import { User } from '../../entities/user.entity';
import { Brackets } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmailForAuth(email);
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
    });
  }

  // async getUsers(): Promise<User[]> {
  //   return this.userRepository.find({
  //     where: {
  //       role: 'consultant',
  //       firstName: 'John',
  //     },
  //   });
  // }

  async getUsers(): Promise<User[]> {
    return this.userRepository
      .getTenantAwareQueryBuilder('user')
      .select([
        'user.id',
        'user.email',
        'user.role',
        'user.firstName',
        'user.lastName',
      ])
      .where(
        new Brackets((qb) =>
          qb
            .where('user.role = :role', { role: 'consultant' })
            .andWhere('user.firstName = :firstName', { firstName: 'John' }),
        ),
      )
      .getMany();
  }
}
