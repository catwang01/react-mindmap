import { DbConnectionFactory } from "../../db/db";

export const connection = DbConnectionFactory.getDbConnection()