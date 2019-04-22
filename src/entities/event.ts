import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Column,
  ManyToOne,
  JoinColumn
} from "typeorm";
import { EventType } from "../interfaces/enum";
import { User } from "./user";

@Entity()
export class Event {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(type => User)
  @JoinColumn()
  user: User;

  @Column({
    type: "enum",
    enum: EventType,
    default: EventType.USER_CREATED
  })
  type!: EventType;

  @Column()
  data?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
