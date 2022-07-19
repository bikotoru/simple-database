import { Pool } from 'pg';

type Connection = {
  user: string;
  host?: string;
  database?: string;
  password: string;
  port?: number;
};
type optionsFind = {
  where?: any[any];
  limit?: number;
  offset?: number;
  order?: string;
};
export class PostgreSql {
  pool = new Pool();
  constructor(private config: Connection) {
    this.config = config;
    this.pool = new Pool({
      user: config.user,
      host: config.host ? config.host : 'localhost',
      database: config.database ? config.database : 'postgres',
      password: config.password,
      port: config.port ? config.port : 5432,
    });
  }

  async query(query: string, values: any[] = []): Promise<any> {
    return this.pool.query(query, values);
  }

  async find(table: string, options?: optionsFind): Promise<any> {
    let query = `select * from ${table}`;
    const where = [];
    for (const key in options.where) {
      where.push(`${key} = ${this.ProcessValue(options.where[key])}`);
    }
    query += ` where ${where.join(' and ')}`;
    if (options) {
      if (options.order) {
        query += ` order by ${options.order}`;
      }
      if (options.limit) {
        query += ` limit ${options.limit}`;
      }
      if (options.offset) {
        query += ` offset ${options.offset}`;
      }
    }

    return this.pool.query(query);
  }

  async execute(query: string): Promise<any> {
    return this.pool.query(query);
  }

  async testConnection(): Promise<boolean> {
    await this.pool.connect();
    return true;
  }

  async insert(table: string, data: any): Promise<any> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const query = `insert into ${table} (${keys.join(',')}) values (${values
      .map((value) => `${this.ProcessValue(value)}`)
      .join(',')})`;
    return this.pool.query(query);
  }

  async update(
    table: string,
    data: any,
    id: number,
    idField: string
  ): Promise<any> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const query = `update ${table} set ${keys
      .map((key) => `${key} = ${this.ProcessValue(values[keys.indexOf(key)])}`)
      .join(',')} where ${idField} = ${this.ProcessValue(id)}`;
    debugger;
    return this.pool.query(query);
  }

  async delete(table: string, id: number, idField: string): Promise<any> {
    return this.pool.query(
      `delete from ${table} where ${idField} = ${this.ProcessValue(id)}`
    );
  }

  async deleteAll(table: string): Promise<any> {
    return this.pool.query(`delete from ${table}`);
  }

  private ProcessValue(x: any) {
    if (typeof x === 'string') {
      return `'${x}'`;
    }
    if (typeof x === 'number') {
      return x;
    }
    if (typeof x === 'boolean') {
      return x ? 'TRUE' : 'FALSE';
    }
    if (typeof x === 'undefined') {
      return 'null';
    }

    if (Object.prototype.toString.call(x) === '[object Null]') {
      return 'null';
    }
    if (Object.prototype.toString.call(x) === '[object Date]') {
      return `'${x.toISOString()}'`;
    }
    throw new Error(
      "Type data is't support " + Object.prototype.toString.call(x)
    );
  }
}
