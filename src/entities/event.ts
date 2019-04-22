import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Column
} from "typeorm";
import { EventType } from "../interfaces/enum";

@Entity()
export class Event {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

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
