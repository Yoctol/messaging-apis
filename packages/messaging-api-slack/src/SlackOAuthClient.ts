import querystring from 'querystring';

import AxiosError from 'axios-error';
import axios, { AxiosInstance } from 'axios';
import omit from 'lodash/omit';
import warning from 'warning';
import {
  OnRequestFunction,
  camelcaseKeysDeep,
  createRequestInterceptor,
  snakecaseKeysDeep,
} from 'messaging-api-common';

import {
  Attachment,
  AvailableMethod,
  Block,
  Channel,
  OAuthAPIResponse,
  User,
} from './SlackTypes';

type CommonOptions = {
  token?: string;
  accessToken?: string;
};

type Message = {
  text?: string;
  attachments?: Attachment[] | string;
  blocks?: Block[] | string;
};

type UpdateMessageOptions = CommonOptions &
  Message & {
    ts: string;
    asUser?: boolean;
    attachments?: string | Attachment[];
    linkNames?: boolean;
    parse?: 'none' | 'full';
  };

type GetInfoOptions = CommonOptions & {
  includeLocale?: boolean;
};

type UserInfoOptions = CommonOptions & {
  includeLocale?: boolean;
};

type DeleteMessageOptions = CommonOptions & {
  channel: string;
  ts: string;
  asUser?: boolean;
};

type DeleteScheduledMessageOptions = CommonOptions & {
  channel: string;
  scheduledMessageId: string;
  asUser?: boolean;
};

type ConversationMembersOptions = CommonOptions & {
  cursor?: string;
  limit?: number;
};

type ConversationListOptions = CommonOptions & {
  cursor?: string;
  excludeArchived?: boolean;
  limit?: number;
  types?: string;
};

type UserListOptions = CommonOptions & {
  cursor?: string;
  includeLocale?: boolean;
  limit?: number;
};

type ClientConfig = {
  accessToken: string;
  origin?: string;
  onRequest?: OnRequestFunction;
};

interface PostMessageOptionalOptions extends CommonOptions {
  asUser?: boolean;
  attachments?: string | Attachment[];
  iconEmoji?: string;
  iconUrl?: string;
  linkNames?: boolean;
  parse?: 'none' | 'full';
  replyBroadcast?: boolean;
  threadTs?: string;
  unfurlLinks?: boolean;
  unfurlMedia?: boolean;
  username?: string;
}

type PostEphemeralOptionalOptions = CommonOptions & {
  asUser?: boolean;
  attachments?: string | Attachment[];
  linkNames?: boolean;
  parse?: 'none' | 'full';
};

type ScheduleMessageOptions = CommonOptions &
  Message & {
    channelId: string;
    asUser?: boolean;
    attachments?: string | Attachment[];
    linkNames?: boolean;
    parse?: 'none' | 'full';
    replyBroadcast?: boolean;
    threadTs?: string;
    unfurlLinks?: boolean;
    unfurlMedia?: boolean;
    postAt?: string;
  };

type PostMessageOptions = PostMessageOptionalOptions &
  Message & {
    channel: string;
  };

type PostEphemeralOptions = PostEphemeralOptionalOptions &
  Message & {
    channel: string;
    user: string;
  };

type GetScheduledMessagesOptions = CommonOptions & {
  channel?: string;
  cursor?: string;
  latest?: string;
  limit?: number;
  oldest?: string;
};

type UnfurlOptions = CommonOptions & {
  ts: string;
  unfurls: {};
  userAuthMessage?: string;
  userAuthRequired?: boolean;
  userAuthUrl?: string;
};

const DEFAULT_PAYLOAD_FIELDS_TO_STRINGIFY = ['attachments', 'blocks'];

function stringifyPayloadFields(
  payload: Record<string, any> = {},
  fields: Array<string> = DEFAULT_PAYLOAD_FIELDS_TO_STRINGIFY
): object {
  fields.forEach(field => {
    if (payload[field] && typeof payload[field] !== 'string') {
      // eslint-disable-next-line no-param-reassign
      payload[field] = JSON.stringify(snakecaseKeysDeep(payload[field]));
    }
  });

  return payload;
}

type GetPermalinkOptions = CommonOptions & {
  channel: string;
  messageTs: string;
};

type MeMessageOptions = CommonOptions & {
  channel: string;
  text: string;
};

export default class SlackOAuthClient {
  _token: string;

  _onRequest: OnRequestFunction | undefined;

  _axios: AxiosInstance;

  chat: {};

  static connect(accessTokenOrConfig: string | ClientConfig): SlackOAuthClient {
    return new SlackOAuthClient(accessTokenOrConfig);
  }

  constructor(accessTokenOrConfig: string | ClientConfig) {
    let origin;

    if (typeof accessTokenOrConfig === 'string') {
      // Bot User OAuth Access Token
      this._token = accessTokenOrConfig;
    } else {
      const config = accessTokenOrConfig;

      this._token = config.accessToken;
      this._onRequest = config.onRequest;
      origin = config.origin;
    }

    // Web API
    // https://api.slack.com/web
    this._axios = axios.create({
      baseURL: `${origin || 'https://slack.com'}/api/`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    this._axios.interceptors.request.use(
      createRequestInterceptor({ onRequest: this._onRequest })
    );

    this.chat = {
      postMessage: this._postMessage.bind(this),
      postEphemeral: this._postEphemeral.bind(this),
      update: this._updateMessage.bind(this),
      delete: this._deleteMessage.bind(this),
      meMessage: this._meMessage.bind(this),
      getPermalink: this._getPermalink.bind(this),
      scheduleMessage: this._scheduleMessage.bind(this),
      deleteScheduledMessage: this._deleteScheduledMessage.bind(this),
      unfurl: this._unfurl.bind(this),
      scheduledMessages: {
        list: this._getScheduledMessages.bind(this),
      },
    };
  }

  get axios(): AxiosInstance {
    return this._axios;
  }

  get accessToken(): string {
    return this._token;
  }

  async callMethod(
    method: AvailableMethod,
    inputBody: Record<string, any> = {}
  ): Promise<OAuthAPIResponse> {
    try {
      const body = {
        ...omit(inputBody, ['token', 'accessToken']),
        token: inputBody.accessToken || inputBody.token || this._token,
      };

      const response = await this._axios.post(
        method,
        querystring.stringify(snakecaseKeysDeep(body) as any)
      );

      const data = (camelcaseKeysDeep(
        response.data
      ) as any) as OAuthAPIResponse;

      if (!data.ok) {
        const { config, request } = response;

        throw new AxiosError(`Slack API - ${data.error}`, {
          config,
          request,
          response,
        });
      }

      return data;
    } catch (err) {
      throw new AxiosError(err.message, err);
    }
  }

  /**
   * Gets information about a channel.
   *
   * https://api.slack.com/methods/channels.info
   */
  getChannelInfo(
    channelId: string,
    options?: GetInfoOptions
  ): Promise<Channel> {
    return this.callMethod('channels.info', {
      channel: channelId,
      ...options,
    }).then(data => data.channel);
  }

  /**
   * Retrieve information about a conversation.
   *
   * https://api.slack.com/methods/conversations.info
   */
  getConversationInfo(
    channelId: string,
    options?: GetInfoOptions
  ): Promise<Channel> {
    return this.callMethod('conversations.info', {
      channel: channelId,
      ...options,
    }).then(data => data.channel);
  }

  /**
   * Retrieve members of a conversation.
   *
   * https://api.slack.com/methods/conversations.members
   */
  getConversationMembers(
    channelId: string,
    options?: ConversationMembersOptions
  ): Promise<{
    members: string[];
    next?: string;
  }> {
    return this.callMethod('conversations.members', {
      channel: channelId,
      ...options,
    }).then(data => ({
      members: data.members,
      next: data.responseMetadata && data.responseMetadata.nextCursor,
    }));
  }

  async getAllConversationMembers(
    channelId: string,
    options?: Omit<ConversationMembersOptions, 'cursor'>
  ): Promise<string[]> {
    let allMembers: string[] = [];
    let continuationCursor;

    do {
      const {
        members,
        next,
      }: {
        members: string[];
        next?: string;
        // eslint-disable-next-line no-await-in-loop
      } = await this.getConversationMembers(channelId, {
        cursor: continuationCursor,
        ...options,
      });

      allMembers = allMembers.concat(members);
      continuationCursor = next;
    } while (continuationCursor);

    return allMembers;
  }

  /**
   * Lists all channels in a Slack team.
   *
   * https://api.slack.com/methods/conversations.list
   */
  getConversationList(
    options?: ConversationListOptions
  ): Promise<{
    channels: Channel[];
    next?: string;
  }> {
    return this.callMethod('conversations.list', options).then(data => ({
      channels: data.channels,
      next: data.responseMetadata && data.responseMetadata.nextCursor,
    }));
  }

  async getAllConversationList(
    options?: Omit<ConversationListOptions, 'cursor'>
  ): Promise<Channel[]> {
    let allChannels: Channel[] = [];
    let continuationCursor: string | undefined;

    do {
      const nextOptions = continuationCursor
        ? { cursor: continuationCursor, ...options }
        : options;
      const {
        channels,
        next,
        // eslint-disable-next-line no-await-in-loop
      } = await this.getConversationList(nextOptions);
      allChannels = allChannels.concat(channels);
      continuationCursor = next;
    } while (continuationCursor);

    return allChannels;
  }

  /**
   * Sends a message to a channel.
   *
   * https://api.slack.com/methods/chat.postMessage
   */
  postMessage(
    channel: string,
    inputMessage: Message | string,
    options: PostMessageOptionalOptions = {}
  ): Promise<OAuthAPIResponse> {
    warning(
      false,
      '`postMessage` is deprecated. Use `chat.postMessage` instead.'
    );

    const message =
      typeof inputMessage === 'string' ? { text: inputMessage } : inputMessage;

    return this._postMessage({
      channel,
      ...message,
      ...options,
    });
  }

  /**
   * Sends a message to a channel.
   *
   * https://api.slack.com/methods/chat.postMessage
   */
  _postMessage(options: PostMessageOptions): Promise<OAuthAPIResponse> {
    return this.callMethod('chat.postMessage', stringifyPayloadFields(options));
  }

  /**
   * Sends an ephemeral message to a user in a channel.
   *
   * https://api.slack.com/methods/chat.postMessage
   */
  postEphemeral(
    channel: string,
    user: string,
    inputMessage: Message | string,
    options: PostEphemeralOptionalOptions = {}
  ): Promise<OAuthAPIResponse> {
    warning(
      false,
      '`postEphemeral` is deprecated. Use `chat.postEphemeral` instead.'
    );

    const message =
      typeof inputMessage === 'string' ? { text: inputMessage } : inputMessage;

    return this._postEphemeral({
      channel,
      user,
      ...message,
      ...options,
    });
  }

  /**
   * Sends an ephemeral message to a user in a channel.
   *
   * https://api.slack.com/methods/chat.postMessage
   */
  _postEphemeral(options: PostEphemeralOptions): Promise<OAuthAPIResponse> {
    return this.callMethod(
      'chat.postEphemeral',
      stringifyPayloadFields(options)
    );
  }

  /**
   * Updates a message.
   *
   * https://api.slack.com/methods/chat.update
   */
  _updateMessage(options: UpdateMessageOptions): Promise<OAuthAPIResponse> {
    return this.callMethod('chat.update', stringifyPayloadFields(options));
  }

  /**
   * Deletes a message.
   *
   * https://api.slack.com/methods/chat.delete
   */
  _deleteMessage(options: DeleteMessageOptions): Promise<OAuthAPIResponse> {
    return this.callMethod('chat.delete', options);
  }

  /**
   * Share a me message into a channel.
   *
   * https://api.slack.com/methods/chat.meMessage
   */
  _meMessage(options: MeMessageOptions): Promise<OAuthAPIResponse> {
    return this.callMethod('chat.meMessage', options);
  }

  /**
   * Retrieve a permalink URL for a specific extant message
   *
   * https://api.slack.com/methods/chat.getPermalink
   */
  _getPermalink(options: GetPermalinkOptions): Promise<OAuthAPIResponse> {
    return this.callMethod('chat.getPermalink', options);
  }

  /**
   * Schedules a message to be sent to a channel.
   *
   * https://api.slack.com/methods/chat.scheduleMessage
   */
  _scheduleMessage(options: ScheduleMessageOptions): Promise<OAuthAPIResponse> {
    return this.callMethod(
      'chat.scheduleMessage',
      stringifyPayloadFields(options)
    );
  }

  /**
   * Deletes a pending scheduled message from the queue.
   *
   * https://api.slack.com/methods/chat.deleteScheduledMessage
   */
  _deleteScheduledMessage(
    options: DeleteScheduledMessageOptions
  ): Promise<OAuthAPIResponse> {
    return this.callMethod('chat.deleteScheduledMessage', options);
  }

  /**
   * Returns a list of scheduled messages.
   *
   * https://api.slack.com/methods/chat.scheduledMessages.list
   */
  _getScheduledMessages(
    options: GetScheduledMessagesOptions = {}
  ): Promise<OAuthAPIResponse> {
    return this.callMethod('chat.scheduledMessages.list', options);
  }

  /**
   * Provide custom unfurl behavior for user-posted URLs
   *
   * https://api.slack.com/methods/chat.unfurl
   */
  _unfurl(options: UnfurlOptions): Promise<OAuthAPIResponse> {
    return this.callMethod('chat.unfurl', options);
  }

  /**
   * Gets information about a user.
   *
   * https://api.slack.com/methods/users.info
   */
  getUserInfo(userId: string, options?: UserInfoOptions): Promise<User> {
    return this.callMethod('users.info', { user: userId, ...options }).then(
      data => data.user
    );
  }

  /**
   * Lists all users in a Slack team.
   *
   * https://api.slack.com/methods/users.list
   */
  getUserList(
    options?: UserListOptions
  ): Promise<{
    members: User[];
    next?: string;
  }> {
    return this.callMethod('users.list', options).then(data => ({
      members: data.members,
      next: data.responseMetadata && data.responseMetadata.nextCursor,
    }));
  }

  async getAllUserList(
    options?: Omit<UserListOptions, 'cursor'>
  ): Promise<User[]> {
    let allUsers: User[] = [];
    let continuationCursor;

    do {
      const {
        members: users,
        next,
      }: {
        members: User[];
        next?: string;
        // eslint-disable-next-line no-await-in-loop
      } = await this.getUserList({
        cursor: continuationCursor,
        ...options,
      });

      allUsers = allUsers.concat(users);
      continuationCursor = next;
    } while (continuationCursor);

    return allUsers;
  }
}
