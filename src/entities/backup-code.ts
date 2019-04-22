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
export class BackupCode {
  @PrimaryGeneratedColumn("uuid")
  code!: number;

  @ManyToOne(type => User)
  @JoinColumn()
  user!: User;

  @Column()
  used!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
