export class FetchDataDto {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  authType?: 'none' | 'jira' | 'slack' = 'none';
}

export class FetchDataResponseDto {
  data: any;
  status: number;
  headers?: Record<string, string>;
}
