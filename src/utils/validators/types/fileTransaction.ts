export enum ValidationStatus {
  SUPPORTED = 'SUPPORTED',
  UNSUPPORTED = 'UNSUPPORTED'
}

export type FileValidationResult =
  | { status: ValidationStatus.SUPPORTED; parsed: unknown }
  | { status: ValidationStatus.UNSUPPORTED; errors: string[] }
