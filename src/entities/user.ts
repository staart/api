import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  OneToOne,
  JoinColumn
} from "typeorm";
import { Email } from "./email";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  name?: string;

  @Column()
  nickname?: string;

  @OneToOne(type => Email)
  @JoinColumn()
  primaryEmail?: Email;

  @Column()
  password?: string;

  @Column()
  twoFactorEnabled?: boolean;

  @Column()
  twoFactorSecret?: string;

  @Column()
  country?: string;

  @Column()
  timezone?: string;

  @Column()
  notificationEmails?: 1 | 2 | 3 | 4;

  @Column()
  preferredLanguage?: string;

  @Column()
  prefersReducedMotion?: boolean;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
