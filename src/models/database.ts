import Database, { type Database as DatabaseType } from 'better-sqlite3';

import { type Config } from '../config.ts';
import { type Dictionary, stringifyWithRules } from '../types/types.ts';

import { readFileSync } from 'fs';

type RowType = User | Generation;
type Table = 'users' | 'generations';
type Operator = 'AND' | 'OR';

export interface User extends Dictionary {
  user_id?: number;
  readonly name?: string;
  readonly surname?: string;
  readonly email?: string;
  readonly password?: string;
  profile_image_path?: string;
}

interface Generation extends Dictionary {
  readonly operation_id?: number;
  readonly user_id: number;
  readonly uploaded_images_paths: string[];
  readonly generated_image_path?: never; // FIXME: REMOVE WITH ACTUAL TYPE LATER.
}

export class ApiDatabase {
  private readonly config: Config;
  private readonly driver: DatabaseType;

  private makeQueryEqualities(values: RowType): string[] {
    let equalities = [];

    for (const property of Object.getOwnPropertyNames(values)) {
      const dataProperty = values[property];
      const value = stringifyWithRules(dataProperty);

      equalities.push(`${property} = ${value}`);
    }

    return equalities;
  }

  /**
   * The `data` parameter type - `Omit<T, keyof T>` should be more specific...
   * @param data - 
   * @param table -
   * @returns -
   */
  private selectRow<T extends RowType>(
    data: T, 
    table: Table, 
    operator: Operator
  ): T {
    let equalities = this.makeQueryEqualities(data);
    const result = this.driver.prepare(
      `SELECT * FROM ${table} WHERE ${equalities.join(` ${operator} `)}`
    );

    return result.get() as T;
  }
  
  /**
   * The `data` parameter type - `Omit<T, keyof T>` should be more specific...
   * @param data -
   * @param table -
   */
  private insertRow<T extends RowType>(data: Omit<T, keyof T>, table: Table): void {
    const fields = [];
    const values = [];

    for (const property of Object.getOwnPropertyNames(data)) {
      // @ts-ignore FIXME: Should be fixed later with typesafe variant. 
      const dataProperty = data[property];
      const value = stringifyWithRules(dataProperty);
      
      fields.push(property);
      values.push(value);
    }

    const statement = this.driver.prepare(
      `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${values.join(', ')})`
    );
    statement.run();
  }

  private isRowExists<T extends RowType>(
    row: T, 
    table: Table,
    operator: Operator
  ): boolean {
    let equalities = this.makeQueryEqualities(row);
    const query = this.driver.prepare(
      `SELECT 1 FROM ${table} WHERE ${equalities.join(` ${operator} `)}`
    );
  
    return query.get() !== undefined;
  }

  public constructor(config: Config) {
    this.config = config;

    this.driver = new Database(this.config.database.file); 
    this.driver.pragma('journal_mode = WAL');
  }

  public checkTables(): void {
    const initdriverQuery = readFileSync(this.config.database.shema, 'utf-8'); 
    this.driver.exec(initdriverQuery);
  }

  public selectUser(user: User, operator: Operator = 'AND'): User {
    return this.selectRow<User>(user, 'users', operator);
  }

  public insertUser(user: Omit<User, 'user_id' | 'profile_image_path'>): void {
    this.insertRow<User>(user, 'users');
  }

  public insertGeneration(
    generation: Omit<Generation, 'operation_id' | 'generated_image_path'>
  ): void {
    this.insertRow<Generation>(generation, 'generations');
  }

  /**
   * The `user` parameter type - `Omit<User, keyof User>` should be more specific...
   * @param user -
   */
  public isUserExists(user: User, operator: Operator = 'AND'): boolean {
    return this.isRowExists(user, 'users', operator);
  }
}
