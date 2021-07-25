// NOTE: Partial definition. To see full one, visit https://developer.twitter.com/en/docs/twitter-api/v1/accounts-and-users/manage-account-settings/api-reference/get-account-verify_credentials
interface GetAccountResponse {
  id_str: string;
  followers_count: number;
  friends_count: number;
}

interface GetUsersRequest {
  id: string;
  pageToken?: string;
}

interface GetUsersResponse {
  data: { id: string; name: string; username: string }[];
  meta: {
    result_count: number;
    next_token?: string;
    previous_token?: string;
  };
}
