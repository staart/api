export interface InsertResult {
  fieldCount: number;
  affectedRows: number;
  insertId: string;
  serverStatus: number;
  warningCount: number;
  message: string;
  protocol41: boolean;
  changedRows: number;
}
