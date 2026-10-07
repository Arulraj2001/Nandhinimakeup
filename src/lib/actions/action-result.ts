export type ActionResult<T = void> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: string;
      fieldErrors?: Record<string, string[] | undefined>;
    };

export function actionSuccess<T>(data: T): ActionResult<T> {
  return {
    success: true,
    data,
  };
}

export function actionError<T = void>(
  error: string,
  fieldErrors?: Record<string, string[] | undefined>
): ActionResult<T> {
  return {
    success: false,
    error,
    fieldErrors,
  };
}
