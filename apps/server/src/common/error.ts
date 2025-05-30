class MySQLError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

export function isMySQLError(error: unknown): error is MySQLError {
  return (
    error instanceof MySQLError ||
    (error instanceof Error &&
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof error.code === 'string')
  );
}
