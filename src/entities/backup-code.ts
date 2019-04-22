import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column
} from "typeorm";

@Entity()
export class BackupCode {
  @PrimaryGeneratedColumn("uuid")
  code!: number;

  @Column()
  userId!: number;

  @Column()
  used!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
