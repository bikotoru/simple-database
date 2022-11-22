import sql from 'mssql';
type optionsFind = {
  where?: any[any];
  limit?: number;
  offset?: number;
  order?: string;
  fields?: string[];
};
type options = {
  host?: string;
  user?: string;
  password?: string;
  database?: string;
  port?: number;
  encrypt?: boolean;
  stringconnection?: string;
};
export class SqlServer {
  private connectionString: string;
  constructor(connection: options) {
    this.connectionString = `
        server=${connection.host ? connection.host : 'localhost'},${
      connection.port ? connection.port : 1433
    };
        user id=${connection.user};
        password=${connection.password};
        database=${connection.database};       
        `;
    if (connection.encrypt) {
      this.connectionString += `Trusted_Connection=true;`;
    }
    if (connection.stringconnection) {
      this.connectionString = connection.stringconnection;
    }
  }

  public async testConnection(): Promise<boolean> {
    await sql.connect(this.connectionString);
    return true;
  }
  public async execute(query: string, isSelect = true): Promise<any> {
    await sql.connect(this.connectionString);
    const result = await new sql.Request().query(query);
    await sql.close();
    if (isSelect) {
      return result.recordset;
    }
    {
      return result;
    }
  }

  public async find(table: string, options?: optionsFind) {
    let query = `select ${
      options !== undefined
        ? options.fields != null
          ? options.fields.length > 0
            ? options.fields.join(',')
            : '*'
          : '*'
        : '*'
    } from ${table}`;

    if (options !== undefined) {
      const where = [];

      for (const key in options.where) {
        where.push(`${key} = ${this.ProcessValue(options.where[key])}`);
      }
      if (where.length > 0) {
        query += ` where ${where.join(' and ')}`;
      }
      if (options.order) {
        query += ` order by ${options.order}`;
      }
      if (options.limit) {
        query += ` OFFSET (${options.offset}-1) * ${options.limit} ROWS FETCH NEXT ${options.limit} ROWS ONLY;`;
      }
    }
    return this.execute(query);
  }

  public async insert(table: string, data: any) {
    let query = `insert into ${table}`;
    const fields = [];
    const values = [];
    for (const key in data) {
      fields.push(key);
      values.push(data[key]);
    }
    query += ` (${fields.join(',')}) values (${values
      .map((x) => this.ProcessValue(x))
      .join(',')})`;
    return this.execute(query, false);
  }
  public async update(table: string, data: any, id: any, idField: string) {
    debugger;
    let query = `update ${table} set`;
    const fields = [];
    for (const key in data) {
      fields.push(`${key} = ${this.ProcessValue(data[key])}`);
    }
    query += ` ${fields.join(',')} where ${idField} = ${this.ProcessValue(id)}`;
    return this.execute(query, false);
  }

  public async delete(table: string, id: any, idField: string) {
    const query = `delete from ${table} where ${idField} = ${this.ProcessValue(
      id
    )}`;
    return this.execute(query, false);
  }

  private ProcessValue(x: any) {
    if (typeof x === 'string') {
      return `'${x}'`;
    }
    if (typeof x === 'number') {
      return x;
    }
    if (typeof x === 'boolean') {
      return x ? 1 : 0;
    }
    if (typeof x === 'undefined') {
      return 'null';
    }
    if (Object.prototype.toString.call(x) === '[object Date]') {
      return `'${x.toISOString()}'`;
    }
    if (Object.prototype.toString.call(x) === '[object Null]') {
      return 'null';
    }
    throw new Error(
      "Type of data is't Support" + Object.prototype.toString.call(x)
    );
  }
}
