export interface MysqlDriverError {
  code: string;
  errno: number;
  sqlMessage: string;
  sqlState: string;
  sql: string;
}
