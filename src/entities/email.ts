import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  ManyToOne,
  JoinColumn
} from "typeorm";
import { User } from "./user";

@Entity()
export class Email {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(type => User)
  @JoinColumn()
  user!: User;

  @Column()
  email!: string;

  @Column()
  isVerified!: boolean;

  @Column()
  isPrimary!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
