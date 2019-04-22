import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  OneToOne,
  JoinColumn,
  ManyToOne
} from "typeorm";
import { UserRole } from "../interfaces/enum";
import { User } from "./user";
import { Organization } from "./organization";

@Entity()
export class Membership {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(type => Organization)
  @JoinColumn()
  organization!: Organization;

  @OneToOne(type => User)
  @JoinColumn()
  user!: User;

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.ADMIN
  })
  role!: UserRole;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
