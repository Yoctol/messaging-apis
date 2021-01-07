import querystring from 'querystring';
import { Readable } from 'stream';

import AxiosError from 'axios-error';
import axios, { AxiosInstance, AxiosError as BaseAxiosError } from 'axios';
import imageType from 'image-type';
import invariant from 'ts-invariant';
import warning from 'warning';
import {
  OnRequestFunction,
  createRequestInterceptor,
} from 'messaging-api-common';

import Line from './Line';
import * as LineTypes from './LineTypes';

function handleError(
  err: BaseAxiosError<{
    message: string;
    details: {
      property: string;
      message: string;
    }[];
  }>
): never {
  if (err.response && err.response.data) {
    const { message, details } = err.response.data;
    let msg = `LINE API - ${message}`;
    if (details && details.length > 0) {
      details.forEach((detail) => {
        msg += `\n- ${detail.property}: ${detail.message}`;
      });
    }
    throw new AxiosError(msg, err);
  }
  throw new AxiosError(err.message, err);
}

/**
 * LineClient is a client for LINE API calls.
 */
export default class LineClient {
  /**
   * @deprecated Use `new LineClient(...)` instead.
   */
  static connect(config: LineTypes.ClientConfig): LineClient {
    warning(
      false,
      '`LineClient.connect(...)` is deprecated. Use `new LineClient(...)` instead.'
    );
    return new LineClient(config);
  }

  /**
   * The underlying axios instance.
   */
  readonly axios: AxiosInstance;

  /**
   * The underlying axios instance for api-data.line.me APIs.
   */
  readonly dataAxios: AxiosInstance;

  /**
   * The access token used by the client
   */
  readonly accessToken: string;

  /**
   * The channel secret used by the client
   */
  readonly channelSecret: string | undefined;

  /**
   * The callback to be called when receiving requests.
   */
  private onRequest?: OnRequestFunction;

  /**
   * Constructor of LineClient
   *
   * Usage:
   * ```ts
   * new LineClient({
   *   accessToken: ACCESS_TOKEN,
   * })
   * ```
   *
   * @param config - [[ClientConfig]]
   */
  constructor(config: LineTypes.ClientConfig) {
    invariant(
      typeof config !== 'string',
      `LineClient: do not allow constructing client with ${config} string. Use object instead.`
    );

    this.accessToken = config.accessToken;
    this.channelSecret = config.channelSecret;
    this.onRequest = config.onRequest;
    const { origin, dataOrigin } = config;

    this.axios = axios.create({
      baseURL: `${origin || 'https://api.line.me'}/`,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    this.axios.interceptors.request.use(
      createRequestInterceptor({ onRequest: this.onRequest })
    );

    this.dataAxios = axios.create({
      baseURL: `${dataOrigin || 'https://api-data.line.me'}/`,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    this.dataAxios.interceptors.request.use(
      createRequestInterceptor({ onRequest: this.onRequest })
    );
  }

  /**
   * Gets a bot's basic information.
   *
   * [Official document](https://developers.line.biz/en/reference/messaging-api/#get-bot-info)
   *
   * @returns Returns status code 200 and a JSON object with the bot information.
   */
  getBotInfo(): Promise<LineTypes.BotInfoResponse> {
    return this.axios
      .get<LineTypes.BotInfoResponse>('/v2/bot/info')
      .then((res) => res.data, handleError);
  }

  /**
   * Gets information on a webhook endpoint.
   *
   * [Official document](https://developers.line.biz/en/reference/messaging-api/#get-webhook-endpoint-information)
   *
   * @returns Returns status code 200 and a JSON object with the webhook information.
   */
  getWebhookEndpointInfo(): Promise<LineTypes.WebhookEndpointInfoResponse> {
    return this.axios
      .get<LineTypes.WebhookEndpointInfoResponse>(
        '/v2/bot/channel/webhook/endpoint'
      )
      .then((res) => res.data, handleError);
  }

  /**
   * Sets the webhook endpoint URL. It may take up to 1 minute for changes to take place due to caching.
   *
   * [Official document](https://developers.line.biz/en/reference/messaging-api/#get-webhook-endpoint-information)
   *
   * @param endpoint - Webhook URL.
   *
   * @returns Returns status code `200` and an empty JSON object.
   */
  setWebhookEndpointUrl(endpoint: string): Promise<{}> {
    return this.axios
      .put<{}>('/v2/bot/channel/webhook/endpoint', { endpoint })
      .then((res) => res.data, handleError);
  }

  /**
   * Checks if the configured webhook endpoint can receive a test webhook event.
   *
   * [Official document](https://developers.line.biz/en/reference/messaging-api/#test-webhook-endpoint)
   *
   * @returns Returns status code 200 and a JSON object with the webhook information.
   */
  testWebhookEndpoint(): Promise<LineTypes.TestWebhookEndpointResponse> {
    return this.axios
      .post<LineTypes.TestWebhookEndpointResponse>(
        '/v2/bot/channel/webhook/test'
      )
      .then((res) => res.data, handleError);
  }

  /**
   * Reply Message
   * Sends a reply message in response to an event from a user, group, or room.
   *
   * To send reply messages, you must have a reply token which is included in a webhook event object.
   *
   * [Webhooks](https://developers.line.biz/en/reference/messaging-api/#webhooks) are used to notify you when an event occurs. For events that you can respond to, a reply token is issued for replying to messages.
   *
   * Because the reply token becomes invalid after a certain period of time, responses should be sent as soon as a message is received. Reply tokens can only be used once.
   *
   * [Official document](https://developers.line.biz/en/reference/messaging-api/#send-reply-message)
   *
   * @param body - Request body
   * @param body.replyToken - Reply token received via webhook
   * @param body.messages - Messages to send (Max: 5)
   *
   * @returns Returns status code `200` and an empty JSON object.
   */
  replyRawBody(body: {
    replyToken: string;
    messages: LineTypes.Message[];
  }): Promise<LineTypes.MutationSuccessResponse> {
    return this.axios
      .post<LineTypes.MutationSuccessResponse>('/v2/bot/message/reply', body)
      .then((res) => res.data, handleError);
  }

  /**
   * Reply Message
   *
   * Sends a reply message in response to an event from a user, group, or room.
   *
   * To send reply messages, you must have a reply token which is included in a webhook event object.
   *
   * [Webhooks](https://developers.line.biz/en/reference/messaging-api/#webhooks) are used to notify you when an event occurs. For events that you can respond to, a reply token is issued for replying to messages.
   *
   * Because the reply token becomes invalid after a certain period of time, responses should be sent as soon as a message is received. Reply tokens can only be used once.
   *
   * [Official document - send reply message](https://developers.line.biz/en/reference/messaging-api/#send-reply-message)
   *
   * @param replyToken - Reply token received via webhook
   * @param messages - Messages to send (Max: 5)
   * @returns Returns status code `200` and an empty JSON object.
   */
  reply(
    replyToken: string,
    messages: LineTypes.Message[]
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.replyRawBody({ replyToken, messages });
  }

  /**
   * Reply Message
   *
   * Sends a reply message in response to an event from a user, group, or room.
   *
   * To send reply messages, you must have a reply token which is included in a webhook event object.
   *
   * [Webhooks](https://developers.line.biz/en/reference/messaging-api/#webhooks) are used to notify you when an event occurs. For events that you can respond to, a reply token is issued for replying to messages.
   *
   * Because the reply token becomes invalid after a certain period of time, responses should be sent as soon as a message is received. Reply tokens can only be used once.
   *
   * [Official document - send reply message](https://developers.line.biz/en/reference/messaging-api/#send-reply-message)
   *
   * @param replyToken - Reply token received via webhook
   * @param messages - Messages to send (Max: 5)
   * @returns Returns status code `200` and an empty JSON object.
   */
  replyMessages(
    replyToken: string,
    messages: LineTypes.Message[]
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.reply(replyToken, messages);
  }

  /**
   * Reply Text Message
   *
   * [Official document - text message](https://developers.line.biz/en/reference/messaging-api/#text-message)
   *
   * @param replyToken - Reply token received via webhook
   * @param text - Message text.
   *
   * You can include the following emoji:
   * - Unicode emoji
   * - LINE original emoji [(Unicode code point table for LINE original emoji)](https://developers.line.biz/media/messaging-api/emoji-list.pdf)
   *
   * Max character limit: 2000
   *
   * @param options - Common properties for messages
   * @returns Returns status code `200` and an empty JSON object.
   */
  replyText(
    replyToken: string,
    text: string,
    options?: LineTypes.MessageOptions & { emojis?: LineTypes.Emoji[] }
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.reply(replyToken, [Line.createText(text, options)]);
  }

  /**
   * Reply Image Message
   *
   * [Official document - image message](https://developers.line.biz/en/reference/messaging-api/#image-message)
   *
   * @param replyToken - Reply token received via webhook
   * @param image - Image
   * @param options - Common properties for messages
   * @param image.originalContentUrl - Image URL
   * - Max character limit: 1000
   * - HTTPS over TLS 1.2 or later
   * - JPEG
   * - Max: 4096 x 4096
   * - Max: 1 MB
   * @param image.previewImageUrl - Preview image URL
   * - Max character limit: 1000
   * - HTTPS over TLS 1.2 or later
   * - JPEG
   * - Max: 240 x 240
   * - Max: 1 MB
   * @returns Returns status code `200` and an empty JSON object.
   */
  replyImage(
    replyToken: string,
    image: {
      originalContentUrl: string;
      previewImageUrl?: string;
    },
    options?: LineTypes.MessageOptions
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.reply(replyToken, [Line.createImage(image, options)]);
  }

  /**
   * Reply Video Message
   *
   * [Official document - video message](https://developers.line.biz/en/reference/messaging-api/#video-message)
   *
   * @param replyToken - Reply token received via webhook
   * @param video - Video
   * @param options - Common properties for messages
   * @param video.originalContentUrl - URL of video file
   *
   * A very wide or tall video may be cropped when played in some environments.
   * - Max character limit: 1000
   * - HTTPS over TLS 1.2 or later
   * - mp4
   * - Max: 1 minute
   * - Max: 10 MB
   *
   * @param video.previewImageUrl - URL of preview image
   * - Max character limit: 1000
   * - HTTPS over TLS 1.2 or later
   * - JPEG
   * - Max: 240 x 240
   * - Max: 1 MB
   * @returns Returns status code `200` and an empty JSON object.
   */
  replyVideo(
    replyToken: string,
    video: {
      originalContentUrl: string;
      previewImageUrl: string;
    },
    options?: LineTypes.MessageOptions
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.reply(replyToken, [Line.createVideo(video, options)]);
  }

  /**
   * Reply Audio Message
   *
   * [Official document - audio message](https://developers.line.biz/en/reference/messaging-api/#audio-message)
   *
   * @param replyToken - Reply token received via webhook
   * @param audio - Audio
   * @param options - Common properties for messages
   * @param audio.originalContentUrl - URL of audio file
   * - Max character limit: 1000
   * - HTTPS over TLS 1.2 or later
   * - m4a
   * - Max: 1 minute
   * - Max: 10 MB
   * @param audio.duration - Length of audio file (milliseconds)
   * @returns Returns status code `200` and an empty JSON object.
   */
  replyAudio(
    replyToken: string,
    audio: {
      originalContentUrl: string;
      duration: number;
    },
    options?: LineTypes.MessageOptions
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.reply(replyToken, [Line.createAudio(audio, options)]);
  }

  /**
   * Reply Location Message
   *
   * [Official document - location message](https://developers.line.biz/en/reference/messaging-api/#location-message)
   *
   * @param replyToken - Reply token received via webhook
   * @param location - Location
   *
   * location.title:
   * - Max character limit: 100
   *
   * location.address:
   * - Max character limit: 100
   *
   * @param options - Common properties for messages
   * @returns Returns status code `200` and an empty JSON object.
   */
  replyLocation(
    replyToken: string,
    location: LineTypes.Location,
    options?: LineTypes.MessageOptions
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.reply(replyToken, [Line.createLocation(location, options)]);
  }

  /**
   * Reply Sticker Message
   *
   * [Official document - sticker message](https://developers.line.biz/en/reference/messaging-api/#sticker-message)
   *
   * @param replyToken - Reply token received via webhook
   * @param sticker - Sticker
   *
   * sticker.packageId:
   * - Package ID for a set of stickers. For information on package IDs, see the [Sticker list](https://developers.line.biz/media/messaging-api/sticker_list.pdf).
   *
   * sticker.stickerId:
   * - Sticker ID. For a list of sticker IDs for stickers that can be sent with the Messaging API, see the [Sticker list](https://developers.line.biz/media/messaging-api/sticker_list.pdf).
   *
   * @param options - Common properties for messages
   * @returns Returns status code `200` and an empty JSON object.
   */
  replySticker(
    replyToken: string,
    sticker: Omit<LineTypes.StickerMessage, 'type'>,
    options?: LineTypes.MessageOptions
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.reply(replyToken, [Line.createSticker(sticker, options)]);
  }

  /**
   * Reply Imagemap Message
   *
   * Imagemap messages are messages configured with an image that has multiple tappable areas. You can assign one tappable area for the entire image or different tappable areas on divided areas of the image.
   *
   * You can also play a video on the image and display a label with a hyperlink after the video is finished.
   *
   * [Official document - imagemap message](https://developers.line.biz/en/reference/messaging-api/#imagemap-message)
   *
   * @param replyToken - Reply token received via webhook
   * @param altText - Alternative text
   * @param imagemap - Imagemap
   * @param options - Common properties for messages
   * @returns Returns status code `200` and an empty JSON object.
   */
  replyImagemap(
    replyToken: string,
    altText: string,
    imagemap: Omit<LineTypes.ImagemapMessage, 'type' | 'altText'>,
    options?: LineTypes.MessageOptions
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.reply(replyToken, [
      Line.createImagemap(altText, imagemap, options),
    ]);
  }

  /**
   * Reply Flex Message
   *
   * Flex Messages are messages with a customizable layout.
   * You can customize the layout freely based on the specification for [CSS Flexible Box (CSS Flexbox)](https://www.w3.org/TR/css-flexbox-1/).
   * For more information, see [Sending Flex Messages](https://developers.line.biz/en/docs/messaging-api/using-flex-messages/) in the API documentation.
   *
   * [Official document - flex message](https://developers.line.biz/en/reference/messaging-api/#flex-message)
   *
   * @param replyToken - Reply token received via webhook
   * @param altText - Alternative text
   * @param flex - Flex Message [container](https://developers.line.biz/en/reference/messaging-api/#container)
   * @param options - Common properties for messages
   * @returns Returns status code `200` and an empty JSON object.
   */
  replyFlex(
    replyToken: string,
    altText: string,
    flex: LineTypes.FlexContainer,
    options?: LineTypes.MessageOptions
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.reply(replyToken, [Line.createFlex(altText, flex, options)]);
  }

  /**
   * Reply Template Message
   *
   * Template messages are messages with predefined layouts which you can customize. For more information, see [Template messages](https://developers.line.biz/en/docs/messaging-api/message-types/#template-messages).
   *
   * The following template types are available:
   * - [Buttons](https://developers.line.biz/en/reference/messaging-api/#buttons)
   * - [Confirm](https://developers.line.biz/en/reference/messaging-api/#confirm)
   * - [Carousel](https://developers.line.biz/en/reference/messaging-api/#carousel)
   * - [Image carousel](https://developers.line.biz/en/reference/messaging-api/#image-carousel)
   *
   * [Official document - template message](https://developers.line.biz/en/reference/messaging-api/#template-messages)
   *
   * @param replyToken - Reply token received via webhook
   * @param altText - Alternative text
   * @param template - A [Buttons](https://developers.line.biz/en/reference/messaging-api/#buttons), [Confirm](https://developers.line.biz/en/reference/messaging-api/#confirm), [Carousel](https://developers.line.biz/en/reference/messaging-api/#carousel), or [Image carousel](https://developers.line.biz/en/reference/messaging-api/#image-carousel) object.
   * @param options - Common properties for messages
   * @returns Returns status code `200` and an empty JSON object.
   */
  replyTemplate(
    replyToken: string,
    altText: string,
    template: LineTypes.Template,
    options?: LineTypes.MessageOptions
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.reply(replyToken, [
      Line.createTemplate(altText, template, options),
    ]);
  }

  /**
   * Reply Button Template Message
   *
   * Template with an image, title, text, and multiple action buttons.
   *
   * [Official document - button template message](https://developers.line.biz/en/reference/messaging-api/#buttons)
   *
   * @param replyToken - Reply token received via webhook
   * @param altText - Alternative text
   * @param buttonTemplate - Button template object
   * @param options - Common properties for messages
   * @returns Returns status code `200` and an empty JSON object.
   */
  replyButtonTemplate(
    replyToken: string,
    altText: string,
    buttonTemplate: Omit<LineTypes.ButtonsTemplate, 'type'>,
    options?: LineTypes.MessageOptions
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.reply(replyToken, [
      Line.createButtonTemplate(altText, buttonTemplate, options),
    ]);
  }

  /**
   * Reply Button Template Message
   *
   * Template with an image, title, text, and multiple action buttons.
   *
   * Because of the height limitation for buttons template messages, the lower part of the text display area will get cut off if the height limitation is exceeded. For this reason, depending on the character width, the message text may not be fully displayed even when it is within the character limits.
   *
   * [Official document - button template message](https://developers.line.biz/en/reference/messaging-api/#buttons)
   *
   * @param replyToken - Reply token received via webhook
   * @param altText - Alternative text
   * @param buttonTemplate - Button template object
   * @param options - Common properties for messages
   * @returns Returns status code `200` and an empty JSON object.
   */
  replyButtonsTemplate(
    replyToken: string,
    altText: string,
    buttonTemplate: Omit<LineTypes.ButtonsTemplate, 'type'>,
    options?: LineTypes.MessageOptions
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.replyButtonTemplate(
      replyToken,
      altText,
      buttonTemplate,
      options
    );
  }

  /**
   * Reply Confirm Template Message
   *
   * Template with two action buttons.
   *
   * Because of the height limitation for confirm template messages, the lower part of the text display area will get cut off if the height limitation is exceeded. For this reason, depending on the character width, the message text may not be fully displayed even when it is within the character limits.
   *
   * [Official document - confirm template message](https://developers.line.biz/en/reference/messaging-api/#confirm)
   *
   * @param replyToken - Reply token received via webhook
   * @param altText - Alternative text
   * @param confirmTemplate - Confirm template object
   * @param options - Common properties for messages
   * @returns Returns status code `200` and an empty JSON object.
   */
  replyConfirmTemplate(
    replyToken: string,
    altText: string,
    confirmTemplate: Omit<LineTypes.ConfirmTemplate, 'type'>,
    options?: LineTypes.MessageOptions
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.reply(replyToken, [
      Line.createConfirmTemplate(altText, confirmTemplate, options),
    ]);
  }

  /**
   * Reply Carousel Template Message
   *
   * Template with multiple columns which can be cycled like a carousel. The columns are shown in order when scrolling horizontally.
   *
   * [Official document - carousel template message](https://developers.line.biz/en/reference/messaging-api/#carousel)
   *
   * @param replyToken - Reply token received via webhook
   * @param altText - Alternative text
   * @param columns - Array of columns for carousel
   *
   * Max columns: 10
   *
   * @param options - Carousel template options
   * @returns Returns status code `200` and an empty JSON object.
   */
  replyCarouselTemplate(
    replyToken: string,
    altText: string,
    columns: LineTypes.ColumnObject[],
    options: LineTypes.CarouselTemplateOptions = {}
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.reply(replyToken, [
      Line.createCarouselTemplate(altText, columns, options),
    ]);
  }

  /**
   * Reply Image Carousel Template Message
   *
   * Template with multiple images which can be cycled like a carousel. The images are shown in order when scrolling horizontally.
   *
   * [Official document - image carousel template message](https://developers.line.biz/en/reference/messaging-api/#image-carousel)
   *
   * @param replyToken - Reply token received via webhook
   * @param altText - Alternative text
   * @param columns - Array of columns for image carousel
   *
   * Max columns: 10
   *
   * @param options - Common properties for messages
   * @returns Returns status code `200` and an empty JSON object.
   */
  replyImageCarouselTemplate(
    replyToken: string,
    altText: string,
    columns: LineTypes.ImageCarouselColumnObject[],
    options?: LineTypes.MessageOptions
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.reply(replyToken, [
      Line.createImageCarouselTemplate(altText, columns, options),
    ]);
  }

  /**
   * Push Message
   *
   * Sends a push message to a user, group, or room at any time.
   *
   * Note: LINE\@ accounts under the free or basic plan cannot call this API endpoint.
   *
   * [Official document - send push message](https://developers.line.biz/en/reference/messaging-api/#send-push-message)
   *
   * @param body - Request body
   * @param body.to - ID of the target recipient. Use a userId, groupId, or roomId value returned in a [webhook event object](https://developers.line.biz/en/reference/messaging-api/#common-properties). Do not use the LINE ID found on LINE.
   * @param body.messages - Messages to send (Max: 5)
   * @returns Returns status code `200` and an empty JSON object.
   */
  pushRawBody(body: {
    to: string;
    messages: LineTypes.Message[];
  }): Promise<LineTypes.MutationSuccessResponse> {
    return this.axios
      .post<LineTypes.MutationSuccessResponse>('/v2/bot/message/push', body)
      .then((res) => res.data, handleError);
  }

  /**
   * Push Message
   *
   * Sends a push message to a user, group, or room at any time.
   *
   * Note: LINE\@ accounts under the free or basic plan cannot call this API endpoint.
   *
   * [Official document - send push message](https://developers.line.biz/en/reference/messaging-api/#send-push-message)
   *
   * @param to - ID of the target recipient. Use a userId, groupId, or roomId value returned in a [webhook event object](https://developers.line.biz/en/reference/messaging-api/#common-properties). Do not use the LINE ID found on LINE.
   * @param messages - Messages to send (Max: 5)
   * @returns Returns status code `200` and an empty JSON object.
   */
  push(
    to: string,
    messages: LineTypes.Message[]
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.pushRawBody({ to, messages });
  }

  /**
   * Push Message
   *
   * Sends a push message to a user, group, or room at any time.
   *
   * Note: LINE\@ accounts under the free or basic plan cannot call this API endpoint.
   *
   * [Official document - send push message](https://developers.line.biz/en/reference/messaging-api/#send-push-message)
   *
   * @param to - ID of the target recipient. Use a userId, groupId, or roomId value returned in a [webhook event object](https://developers.line.biz/en/reference/messaging-api/#common-properties). Do not use the LINE ID found on LINE.
   * @param messages - Messages to send (Max: 5)
   * @returns Returns status code `200` and an empty JSON object.
   */
  pushMessages(
    to: string,
    messages: LineTypes.Message[]
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.push(to, messages);
  }

  /**
   * Push Text Message
   *
   * [Official document - text message](https://developers.line.biz/en/reference/messaging-api/#text-message)
   *
   * @param to - ID of the target recipient. Use a userId, groupId, or roomId value returned in a [webhook event object](https://developers.line.biz/en/reference/messaging-api/#common-properties). Do not use the LINE ID found on LINE.
   * @param text - Message text.
   *
   * You can include the following emoji:
   * - Unicode emoji
   * - LINE original emoji [(Unicode code point table for LINE original emoji)](https://developers.line.biz/media/messaging-api/emoji-list.pdf)
   *
   * Max character limit: 2000
   *
   * @param options - Common properties for messages
   * @returns Returns status code `200` and an empty JSON object.
   */
  pushText(
    to: string,
    text: string,
    options?: LineTypes.MessageOptions & { emojis?: LineTypes.Emoji[] }
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.push(to, [Line.createText(text, options)]);
  }

  /**
   * Push Image Message
   *
   * [Official document - image message](https://developers.line.biz/en/reference/messaging-api/#image-message)
   *
   * @param to - ID of the target recipient. Use a userId, groupId, or roomId value returned in a [webhook event object](https://developers.line.biz/en/reference/messaging-api/#common-properties). Do not use the LINE ID found on LINE.
   * @param image - Image
   * @param options - Common properties for messages
   * @param image.originalContentUrl - Image URL
   * - Max character limit: 1000
   * - HTTPS over TLS 1.2 or later
   * - JPEG
   * - Max: 4096 x 4096
   * - Max: 1 MB
   * @param image.previewImageUrl - Preview image URL
   * - Max character limit: 1000
   * - HTTPS over TLS 1.2 or later
   * - JPEG
   * - Max: 240 x 240
   * - Max: 1 MB
   * @returns Returns status code `200` and an empty JSON object.
   */
  pushImage(
    to: string,
    image: {
      originalContentUrl: string;
      previewImageUrl?: string;
    },
    options: LineTypes.MessageOptions
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.push(to, [Line.createImage(image, options)]);
  }

  /**
   * Push Video Message
   *
   * [Official document - video message](https://developers.line.biz/en/reference/messaging-api/#video-message)
   *
   * @param to - ID of the target recipient. Use a userId, groupId, or roomId value returned in a [webhook event object](https://developers.line.biz/en/reference/messaging-api/#common-properties). Do not use the LINE ID found on LINE.
   * @param video - Video
   * @param options - Common properties for messages
   * @param video.originalContentUrl - URL of video file
   *
   * A very wide or tall video may be cropped when played in some environments.
   * - Max character limit: 1000
   * - HTTPS over TLS 1.2 or later
   * - mp4
   * - Max: 1 minute
   * - Max: 10 MB
   *
   * @param video.previewImageUrl - URL of preview image
   * - Max character limit: 1000
   * - HTTPS over TLS 1.2 or later
   * - JPEG
   * - Max: 240 x 240
   * - Max: 1 MB
   * @returns Returns status code `200` and an empty JSON object.
   */
  pushVideo(
    to: string,
    video: {
      originalContentUrl: string;
      previewImageUrl: string;
    },
    options?: LineTypes.MessageOptions
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.push(to, [Line.createVideo(video, options)]);
  }

  /**
   * Push Audio Message
   *
   * [Official document - audio message](https://developers.line.biz/en/reference/messaging-api/#audio-message)
   *
   * @param to - ID of the target recipient. Use a userId, groupId, or roomId value returned in a [webhook event object](https://developers.line.biz/en/reference/messaging-api/#common-properties). Do not use the LINE ID found on LINE.
   * @param audio - Audio
   * @param options - Common properties for messages
   * @param audio.originalContentUrl - URL of audio file
   * - Max character limit: 1000
   * - HTTPS over TLS 1.2 or later
   * - m4a
   * - Max: 1 minute
   * - Max: 10 MB
   * @param audio.duration - Length of audio file (milliseconds)
   * @returns Returns status code `200` and an empty JSON object.
   */
  pushAudio(
    to: string,
    audio: {
      originalContentUrl: string;
      duration: number;
    },
    options?: LineTypes.MessageOptions
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.push(to, [Line.createAudio(audio, options)]);
  }

  /**
   * Push Location Message
   *
   * [Official document - location message](https://developers.line.biz/en/reference/messaging-api/#location-message)
   *
   * @param to - ID of the target recipient. Use a userId, groupId, or roomId value returned in a [webhook event object](https://developers.line.biz/en/reference/messaging-api/#common-properties). Do not use the LINE ID found on LINE.
   * @param location - Location
   *
   * location.title:
   * - Max character limit: 100
   *
   * location.address:
   * - Max character limit: 100
   *
   * @param options - Common properties for messages
   * @returns Returns status code `200` and an empty JSON object.
   */
  pushLocation(
    to: string,
    location: LineTypes.Location,
    options?: LineTypes.MessageOptions
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.push(to, [Line.createLocation(location, options)]);
  }

  /**
   * Push Sticker Message
   *
   * [Official document - sticker message](https://developers.line.biz/en/reference/messaging-api/#sticker-message)
   *
   * @param to - ID of the target recipient. Use a userId, groupId, or roomId value returned in a [webhook event object](https://developers.line.biz/en/reference/messaging-api/#common-properties). Do not use the LINE ID found on LINE.
   * @param sticker - Sticker
   *
   * sticker.packageId:
   * - Package ID for a set of stickers. For information on package IDs, see the [Sticker list](https://developers.line.biz/media/messaging-api/sticker_list.pdf).
   *
   * sticker.stickerId:
   * - Sticker ID. For a list of sticker IDs for stickers that can be sent with the Messaging API, see the [Sticker list](https://developers.line.biz/media/messaging-api/sticker_list.pdf).
   *
   * @param options - Common properties for messages
   * @returns Returns status code `200` and an empty JSON object.
   */
  pushSticker(
    to: string,
    sticker: Omit<LineTypes.StickerMessage, 'type'>,
    options?: LineTypes.MessageOptions
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.push(to, [Line.createSticker(sticker, options)]);
  }

  /**
   * Push Imagemap Message
   *
   * Imagemap messages are messages configured with an image that has multiple tappable areas. You can assign one tappable area for the entire image or different tappable areas on divided areas of the image.
   *
   * You can also play a video on the image and display a label with a hyperlink after the video is finished.
   *
   * [Official document - imagemap message](https://developers.line.biz/en/reference/messaging-api/#imagemap-message)
   *
   * @param to - ID of the target recipient. Use a userId, groupId, or roomId value returned in a [webhook event object](https://developers.line.biz/en/reference/messaging-api/#common-properties). Do not use the LINE ID found on LINE.
   * @param altText - Alternative text
   * @param imagemap - Imagemap
   * @param options - Common properties for messages
   * @returns Returns status code `200` and an empty JSON object.
   */
  pushImagemap(
    to: string,
    altText: string,
    imagemap: Omit<LineTypes.ImagemapMessage, 'type' | 'altText'>,
    options?: LineTypes.MessageOptions
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.push(to, [Line.createImagemap(altText, imagemap, options)]);
  }

  /**
   * Push Flex Message
   *
   * Flex Messages are messages with a customizable layout.
   * You can customize the layout freely based on the specification for [CSS Flexible Box (CSS Flexbox)](https://www.w3.org/TR/css-flexbox-1/).
   * For more information, see [Sending Flex Messages](https://developers.line.biz/en/docs/messaging-api/using-flex-messages/) in the API documentation.
   *
   * [Official document - flex message](https://developers.line.biz/en/reference/messaging-api/#flex-message)
   *
   * @param to - ID of the target recipient. Use a userId, groupId, or roomId value returned in a [webhook event object](https://developers.line.biz/en/reference/messaging-api/#common-properties). Do not use the LINE ID found on LINE.
   * @param altText - Alternative text
   * @param flex - Flex Message [container](https://developers.line.biz/en/reference/messaging-api/#container)
   * @param options - Common properties for messages
   * @returns Returns status code `200` and an empty JSON object.
   */
  pushFlex(
    to: string,
    altText: string,
    flex: LineTypes.FlexContainer,
    options?: LineTypes.MessageOptions
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.push(to, [Line.createFlex(altText, flex, options)]);
  }

  /**
   * Push Template Message
   *
   * Template messages are messages with predefined layouts which you can customize. For more information, see [Template messages](https://developers.line.biz/en/docs/messaging-api/message-types/#template-messages).
   *
   * The following template types are available:
   * - [Buttons](https://developers.line.biz/en/reference/messaging-api/#buttons)
   * - [Confirm](https://developers.line.biz/en/reference/messaging-api/#confirm)
   * - [Carousel](https://developers.line.biz/en/reference/messaging-api/#carousel)
   * - [Image carousel](https://developers.line.biz/en/reference/messaging-api/#image-carousel)
   *
   * [Official document - template message](https://developers.line.biz/en/reference/messaging-api/#template-messages)
   *
   * @param to - ID of the target recipient. Use a userId, groupId, or roomId value returned in a [webhook event object](https://developers.line.biz/en/reference/messaging-api/#common-properties). Do not use the LINE ID found on LINE.
   * @param altText - Alternative text
   * @param template - A [Buttons](https://developers.line.biz/en/reference/messaging-api/#buttons), [Confirm](https://developers.line.biz/en/reference/messaging-api/#confirm), [Carousel](https://developers.line.biz/en/reference/messaging-api/#carousel), or [Image carousel](https://developers.line.biz/en/reference/messaging-api/#image-carousel) object.
   * @param options - Common properties for messages
   * @returns Returns status code `200` and an empty JSON object.
   */
  pushTemplate(
    to: string,
    altText: string,
    template: LineTypes.Template,
    options?: LineTypes.MessageOptions
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.push(to, [Line.createTemplate(altText, template, options)]);
  }

  /**
   * Push Button Template Message
   *
   * Template with an image, title, text, and multiple action buttons.
   *
   * [Official document - button template message](https://developers.line.biz/en/reference/messaging-api/#buttons)
   *
   * @param to - ID of the target recipient. Use a userId, groupId, or roomId value returned in a [webhook event object](https://developers.line.biz/en/reference/messaging-api/#common-properties). Do not use the LINE ID found on LINE.
   * @param altText - Alternative text
   * @param buttonTemplate - Button template object
   * @param options - Common properties for messages
   * @returns Returns status code `200` and an empty JSON object.
   */
  pushButtonTemplate(
    to: string,
    altText: string,
    buttonTemplate: Omit<LineTypes.ButtonsTemplate, 'type'>,
    options?: LineTypes.MessageOptions
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.push(to, [
      Line.createButtonTemplate(altText, buttonTemplate, options),
    ]);
  }

  /**
   * Push Button Template Message
   *
   * Template with an image, title, text, and multiple action buttons.
   *
   * Because of the height limitation for buttons template messages, the lower part of the text display area will get cut off if the height limitation is exceeded. For this reason, depending on the character width, the message text may not be fully displayed even when it is within the character limits.
   *
   * [Official document - button template message](https://developers.line.biz/en/reference/messaging-api/#buttons)
   *
   * @param to - ID of the target recipient. Use a userId, groupId, or roomId value returned in a [webhook event object](https://developers.line.biz/en/reference/messaging-api/#common-properties). Do not use the LINE ID found on LINE.
   * @param altText - Alternative text
   * @param buttonTemplate - Button template object
   * @param options - Common properties for messages
   * @returns Returns status code `200` and an empty JSON object.
   */
  pushButtonsTemplate(
    to: string,
    altText: string,
    buttonTemplate: Omit<LineTypes.ButtonsTemplate, 'type'>,
    options?: LineTypes.MessageOptions
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.pushButtonTemplate(to, altText, buttonTemplate, options);
  }

  /**
   * Push Confirm Template Message
   *
   * Template with two action buttons.
   *
   * Because of the height limitation for confirm template messages, the lower part of the text display area will get cut off if the height limitation is exceeded. For this reason, depending on the character width, the message text may not be fully displayed even when it is within the character limits.
   *
   * [Official document - confirm template message](https://developers.line.biz/en/reference/messaging-api/#confirm)
   *
   * @param to - ID of the target recipient. Use a userId, groupId, or roomId value returned in a [webhook event object](https://developers.line.biz/en/reference/messaging-api/#common-properties). Do not use the LINE ID found on LINE.
   * @param altText - Alternative text
   * @param confirmTemplate - Confirm template object
   * @param options - Common properties for messages
   * @returns Returns status code `200` and an empty JSON object.
   */
  pushConfirmTemplate(
    to: string,
    altText: string,
    confirmTemplate: Omit<LineTypes.ConfirmTemplate, 'type'>,
    options?: LineTypes.MessageOptions
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.push(to, [
      Line.createConfirmTemplate(altText, confirmTemplate, options),
    ]);
  }

  /**
   * Push Carousel Template Message
   *
   * Template with multiple columns which can be cycled like a carousel. The columns are shown in order when scrolling horizontally.
   *
   * [Official document - carousel template message](https://developers.line.biz/en/reference/messaging-api/#carousel)
   *
   * @param to - ID of the target recipient. Use a userId, groupId, or roomId value returned in a [webhook event object](https://developers.line.biz/en/reference/messaging-api/#common-properties). Do not use the LINE ID found on LINE.
   * @param altText - Alternative text
   * @param columns - Array of columns for carousel
   *
   * Max columns: 10
   *
   * @param options - Carousel template options
   * @returns Returns status code `200` and an empty JSON object.
   */
  pushCarouselTemplate(
    to: string,
    altText: string,
    columns: LineTypes.ColumnObject[],
    options: LineTypes.CarouselTemplateOptions = {}
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.push(to, [
      Line.createCarouselTemplate(altText, columns, options),
    ]);
  }

  /**
   * Push Image Carousel Template Message
   *
   * Template with multiple images which can be cycled like a carousel. The images are shown in order when scrolling horizontally.
   *
   * [Official document - image carousel template message](https://developers.line.biz/en/reference/messaging-api/#image-carousel)
   *
   * @param to - ID of the target recipient. Use a userId, groupId, or roomId value returned in a [webhook event object](https://developers.line.biz/en/reference/messaging-api/#common-properties). Do not use the LINE ID found on LINE.
   * @param altText - Alternative text
   * @param columns - Array of columns for image carousel
   *
   * Max columns: 10
   *
   * @param options - Common properties for messages
   * @returns Returns status code `200` and an empty JSON object.
   */
  pushImageCarouselTemplate(
    to: string,
    altText: string,
    columns: LineTypes.ImageCarouselColumnObject[],
    options?: LineTypes.MessageOptions
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.push(to, [
      Line.createImageCarouselTemplate(altText, columns, options),
    ]);
  }

  /**
   * Multicast Message
   *
   * Sends push messages to multiple users at any time. Messages cannot be sent to groups or rooms.
   *
   * Note: LINE\@ accounts under the free or basic plan cannot call this API endpoint.
   *
   * [Official document - send multicast message](https://developers.line.biz/en/reference/messaging-api/#send-multicast-message)
   *
   * @param body - Request body
   * @param body.to - Array of user IDs. Use userId values which are returned in [webhook event objects](https://developers.line.biz/en/reference/messaging-api/#common-properties). Do not use LINE IDs found on LINE.
   * - Max: 150 user IDs
   * @param body.messages - Messages to send (Max: 5)
   * @returns Returns status code `200` and an empty JSON object.
   */
  multicastRawBody(body: {
    to: string[];
    messages: LineTypes.Message[];
  }): Promise<LineTypes.MutationSuccessResponse> {
    return this.axios
      .post<LineTypes.MutationSuccessResponse>(
        '/v2/bot/message/multicast',
        body
      )
      .then((res) => res.data, handleError);
  }

  /**
   * Multicast Message
   *
   * Sends push messages to multiple users at any time. Messages cannot be sent to groups or rooms.
   *
   * Note: LINE\@ accounts under the free or basic plan cannot call this API endpoint.
   *
   * [Official document - send multicast message](https://developers.line.biz/en/reference/messaging-api/#send-multicast-message)
   *
   * @param to - Array of user IDs. Use userId values which are returned in [webhook event objects](https://developers.line.biz/en/reference/messaging-api/#common-properties). Do not use LINE IDs found on LINE.
   * - Max: 150 user IDs
   * @param messages - Messages to send (Max: 5)
   * @returns Returns status code `200` and an empty JSON object.
   */
  multicast(
    to: string[],
    messages: LineTypes.Message[]
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.multicastRawBody({ to, messages });
  }

  /**
   * Multicast Message
   *
   * Sends push messages to multiple users at any time. Messages cannot be sent to groups or rooms.
   *
   * Note: LINE\@ accounts under the free or basic plan cannot call this API endpoint.
   *
   * [Official document - send multicast message](https://developers.line.biz/en/reference/messaging-api/#send-multicast-message)
   *
   * @param to - Array of user IDs. Use userId values which are returned in [webhook event objects](https://developers.line.biz/en/reference/messaging-api/#common-properties). Do not use LINE IDs found on LINE.
   * - Max: 150 user IDs
   * @param messages - Messages to send (Max: 5)
   * @returns Returns status code `200` and an empty JSON object.
   */
  multicastMessages(
    to: string[],
    messages: LineTypes.Message[]
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.multicast(to, messages);
  }

  /**
   * Multicast Text Message
   *
   * [Official document - text message](https://developers.line.biz/en/reference/messaging-api/#text-message)
   *
   * @param to - Array of user IDs. Use userId values which are returned in [webhook event objects](https://developers.line.biz/en/reference/messaging-api/#common-properties). Do not use LINE IDs found on LINE.
   * - Max: 150 user IDs
   * @param text - Message text.
   *
   * You can include the following emoji:
   * - Unicode emoji
   * - LINE original emoji [(Unicode code point table for LINE original emoji)](https://developers.line.biz/media/messaging-api/emoji-list.pdf)
   *
   * Max character limit: 2000
   *
   * @param options - Common properties for messages
   * @returns Returns status code `200` and an empty JSON object.
   */
  multicastText(
    to: string[],
    text: string,
    options?: LineTypes.MessageOptions & { emojis?: LineTypes.Emoji[] }
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.multicast(to, [Line.createText(text, options)]);
  }

  /**
   * Multicast Image Message
   *
   * [Official document - image message](https://developers.line.biz/en/reference/messaging-api/#image-message)
   *
   * @param to - Array of user IDs. Use userId values which are returned in [webhook event objects](https://developers.line.biz/en/reference/messaging-api/#common-properties). Do not use LINE IDs found on LINE.
   * - Max: 150 user IDs
   * @param image - Image
   * @param options - Common properties for messages
   * @param image.originalContentUrl - Image URL
   * - Max character limit: 1000
   * - HTTPS over TLS 1.2 or later
   * - JPEG
   * - Max: 4096 x 4096
   * - Max: 1 MB
   * @param image.previewImageUrl - Preview image URL
   * - Max character limit: 1000
   * - HTTPS over TLS 1.2 or later
   * - JPEG
   * - Max: 240 x 240
   * - Max: 1 MB
   * @returns Returns status code `200` and an empty JSON object.
   */
  multicastImage(
    to: string[],
    image: {
      originalContentUrl: string;
      previewImageUrl?: string;
    },
    options?: LineTypes.MessageOptions
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.multicast(to, [Line.createImage(image, options)]);
  }

  /**
   * Multicast Video Message
   *
   * [Official document - video message](https://developers.line.biz/en/reference/messaging-api/#video-message)
   *
   * @param to - Array of user IDs. Use userId values which are returned in [webhook event objects](https://developers.line.biz/en/reference/messaging-api/#common-properties). Do not use LINE IDs found on LINE.
   * - Max: 150 user IDs
   * @param video - Video
   * @param options - Common properties for messages
   * @param video.originalContentUrl - URL of video file
   *
   * A very wide or tall video may be cropped when played in some environments.
   * - Max character limit: 1000
   * - HTTPS over TLS 1.2 or later
   * - mp4
   * - Max: 1 minute
   * - Max: 10 MB
   *
   * @param video.previewImageUrl - URL of preview image
   * - Max character limit: 1000
   * - HTTPS over TLS 1.2 or later
   * - JPEG
   * - Max: 240 x 240
   * - Max: 1 MB
   * @returns Returns status code `200` and an empty JSON object.
   */
  multicastVideo(
    to: string[],
    video: {
      originalContentUrl: string;
      previewImageUrl: string;
    },
    options?: LineTypes.MessageOptions
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.multicast(to, [Line.createVideo(video, options)]);
  }

  /**
   * Multicast Audio Message
   *
   * [Official document - audio message](https://developers.line.biz/en/reference/messaging-api/#audio-message)
   *
   * @param to - Array of user IDs. Use userId values which are returned in [webhook event objects](https://developers.line.biz/en/reference/messaging-api/#common-properties). Do not use LINE IDs found on LINE.
   * - Max: 150 user IDs
   * @param audio - Audio
   * @param options - Common properties for messages
   * @param audio.originalContentUrl - URL of audio file
   * - Max character limit: 1000
   * - HTTPS over TLS 1.2 or later
   * - m4a
   * - Max: 1 minute
   * - Max: 10 MB
   * @param audio.duration - Length of audio file (milliseconds)
   * @returns Returns status code `200` and an empty JSON object.
   */
  multicastAudio(
    to: string[],
    audio: {
      originalContentUrl: string;
      duration: number;
    },
    options?: LineTypes.MessageOptions
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.multicast(to, [Line.createAudio(audio, options)]);
  }

  /**
   * Multicast Location Message
   *
   * [Official document - location message](https://developers.line.biz/en/reference/messaging-api/#location-message)
   *
   * @param to - Array of user IDs. Use userId values which are returned in [webhook event objects](https://developers.line.biz/en/reference/messaging-api/#common-properties). Do not use LINE IDs found on LINE.
   * - Max: 150 user IDs
   * @param location - Location
   *
   * location.title:
   * - Max character limit: 100
   *
   * location.address:
   * - Max character limit: 100
   *
   * @param options - Common properties for messages
   * @returns Returns status code `200` and an empty JSON object.
   */
  multicastLocation(
    to: string[],
    location: LineTypes.Location,
    options?: LineTypes.MessageOptions
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.multicast(to, [Line.createLocation(location, options)]);
  }

  /**
   * Multicast Sticker Message
   *
   * [Official document - sticker message](https://developers.line.biz/en/reference/messaging-api/#sticker-message)
   *
   * @param to - Array of user IDs. Use userId values which are returned in [webhook event objects](https://developers.line.biz/en/reference/messaging-api/#common-properties). Do not use LINE IDs found on LINE.
   * - Max: 150 user IDs
   * @param sticker - Sticker
   *
   * sticker.packageId:
   * - Package ID for a set of stickers. For information on package IDs, see the [Sticker list](https://developers.line.biz/media/messaging-api/sticker_list.pdf).
   *
   * sticker.stickerId:
   * - Sticker ID. For a list of sticker IDs for stickers that can be sent with the Messaging API, see the [Sticker list](https://developers.line.biz/media/messaging-api/sticker_list.pdf).
   *
   * @param options - Common properties for messages
   * @returns Returns status code `200` and an empty JSON object.
   */
  multicastSticker(
    to: string[],
    sticker: Omit<LineTypes.StickerMessage, 'type'>,
    options?: LineTypes.MessageOptions
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.multicast(to, [Line.createSticker(sticker, options)]);
  }

  /**
   * Multicast Imagemap Message
   *
   * Imagemap messages are messages configured with an image that has multiple tappable areas. You can assign one tappable area for the entire image or different tappable areas on divided areas of the image.
   *
   * You can also play a video on the image and display a label with a hyperlink after the video is finished.
   *
   * [Official document - imagemap message](https://developers.line.biz/en/reference/messaging-api/#imagemap-message)
   *
   * @param to - Array of user IDs. Use userId values which are returned in [webhook event objects](https://developers.line.biz/en/reference/messaging-api/#common-properties). Do not use LINE IDs found on LINE.
   * - Max: 150 user IDs
   * @param altText - Alternative text
   * @param imagemap - Imagemap
   * @param options - Common properties for messages
   * @returns Returns status code `200` and an empty JSON object.
   */
  multicastImagemap(
    to: string[],
    altText: string,
    imagemap: Omit<LineTypes.ImagemapMessage, 'type' | 'altText'>,
    options?: LineTypes.MessageOptions
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.multicast(to, [
      Line.createImagemap(altText, imagemap, options),
    ]);
  }

  /**
   * Multicast Flex Message
   *
   * Flex Messages are messages with a customizable layout.
   * You can customize the layout freely based on the specification for [CSS Flexible Box (CSS Flexbox)](https://www.w3.org/TR/css-flexbox-1/).
   * For more information, see [Sending Flex Messages](https://developers.line.biz/en/docs/messaging-api/using-flex-messages/) in the API documentation.
   *
   * [Official document - flex message](https://developers.line.biz/en/reference/messaging-api/#flex-message)
   *
   * @param to - Array of user IDs. Use userId values which are returned in [webhook event objects](https://developers.line.biz/en/reference/messaging-api/#common-properties). Do not use LINE IDs found on LINE.
   * - Max: 150 user IDs
   * @param altText - Alternative text
   * @param flex - Flex Message [container](https://developers.line.biz/en/reference/messaging-api/#container)
   * @param options - Common properties for messages
   * @returns Returns status code `200` and an empty JSON object.
   */
  multicastFlex(
    to: string[],
    altText: string,
    flex: LineTypes.FlexContainer,
    options?: LineTypes.MessageOptions
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.multicast(to, [Line.createFlex(altText, flex, options)]);
  }

  /**
   * Multicast Template Message
   *
   * Template messages are messages with predefined layouts which you can customize. For more information, see [Template messages](https://developers.line.biz/en/docs/messaging-api/message-types/#template-messages).
   *
   * The following template types are available:
   * - [Buttons](https://developers.line.biz/en/reference/messaging-api/#buttons)
   * - [Confirm](https://developers.line.biz/en/reference/messaging-api/#confirm)
   * - [Carousel](https://developers.line.biz/en/reference/messaging-api/#carousel)
   * - [Image carousel](https://developers.line.biz/en/reference/messaging-api/#image-carousel)
   *
   * [Official document - template message](https://developers.line.biz/en/reference/messaging-api/#template-messages)
   *
   * @param to - Array of user IDs. Use userId values which are returned in [webhook event objects](https://developers.line.biz/en/reference/messaging-api/#common-properties). Do not use LINE IDs found on LINE.
   * - Max: 150 user IDs
   * @param altText - Alternative text
   * @param template - A [Buttons](https://developers.line.biz/en/reference/messaging-api/#buttons), [Confirm](https://developers.line.biz/en/reference/messaging-api/#confirm), [Carousel](https://developers.line.biz/en/reference/messaging-api/#carousel), or [Image carousel](https://developers.line.biz/en/reference/messaging-api/#image-carousel) object.
   * @param options - Common properties for messages
   * @returns Returns status code `200` and an empty JSON object.
   */
  multicastTemplate(
    to: string[],
    altText: string,
    template: LineTypes.Template,
    options?: LineTypes.MessageOptions
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.multicast(to, [
      Line.createTemplate(altText, template, options),
    ]);
  }

  /**
   * Multicast Button Template Message
   *
   * Template with an image, title, text, and multiple action buttons.
   *
   * [Official document - button template message](https://developers.line.biz/en/reference/messaging-api/#buttons)
   *
   * @param to - Array of user IDs. Use userId values which are returned in [webhook event objects](https://developers.line.biz/en/reference/messaging-api/#common-properties). Do not use LINE IDs found on LINE.
   * - Max: 150 user IDs
   * @param altText - Alternative text
   * @param buttonTemplate - Button template object
   * @param options - Common properties for messages
   * @returns Returns status code `200` and an empty JSON object.
   */
  multicastButtonTemplate(
    to: string[],
    altText: string,
    buttonTemplate: Omit<LineTypes.ButtonsTemplate, 'type'>,
    options?: LineTypes.MessageOptions
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.multicast(to, [
      Line.createButtonTemplate(altText, buttonTemplate, options),
    ]);
  }

  /**
   * Multicast Button Template Message
   *
   * Template with an image, title, text, and multiple action buttons.
   *
   * Because of the height limitation for buttons template messages, the lower part of the text display area will get cut off if the height limitation is exceeded. For this reason, depending on the character width, the message text may not be fully displayed even when it is within the character limits.
   *
   * [Official document - button template message](https://developers.line.biz/en/reference/messaging-api/#buttons)
   *
   * @param to - Array of user IDs. Use userId values which are returned in [webhook event objects](https://developers.line.biz/en/reference/messaging-api/#common-properties). Do not use LINE IDs found on LINE.
   * - Max: 150 user IDs
   * @param altText - Alternative text
   * @param buttonTemplate - Button template object
   * @param options - Common properties for messages
   * @returns Returns status code `200` and an empty JSON object.
   */
  multicastButtonsTemplate(
    to: string[],
    altText: string,
    buttonTemplate: Omit<LineTypes.ButtonsTemplate, 'type'>,
    options?: LineTypes.MessageOptions
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.multicastButtonTemplate(to, altText, buttonTemplate, options);
  }

  /**
   * Multicast Confirm Template Message
   *
   * Template with two action buttons.
   *
   * Because of the height limitation for confirm template messages, the lower part of the text display area will get cut off if the height limitation is exceeded. For this reason, depending on the character width, the message text may not be fully displayed even when it is within the character limits.
   *
   * [Official document - confirm template message](https://developers.line.biz/en/reference/messaging-api/#confirm)
   *
   * @param to - Array of user IDs. Use userId values which are returned in [webhook event objects](https://developers.line.biz/en/reference/messaging-api/#common-properties). Do not use LINE IDs found on LINE.
   * - Max: 150 user IDs
   * @param altText - Alternative text
   * @param confirmTemplate - Confirm template object
   * @param options - Common properties for messages
   * @returns Returns status code `200` and an empty JSON object.
   */
  multicastConfirmTemplate(
    to: string[],
    altText: string,
    confirmTemplate: Omit<LineTypes.ConfirmTemplate, 'type'>,
    options?: LineTypes.MessageOptions
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.multicast(to, [
      Line.createConfirmTemplate(altText, confirmTemplate, options),
    ]);
  }

  /**
   * Multicast Carousel Template Message
   *
   * Template with multiple columns which can be cycled like a carousel. The columns are shown in order when scrolling horizontally.
   *
   * [Official document - carousel template message](https://developers.line.biz/en/reference/messaging-api/#carousel)
   *
   * @param to - Array of user IDs. Use userId values which are returned in [webhook event objects](https://developers.line.biz/en/reference/messaging-api/#common-properties). Do not use LINE IDs found on LINE.
   * - Max: 150 user IDs
   * @param altText - Alternative text
   * @param columns - Array of columns for carousel
   *
   * Max columns: 10
   *
   * @param options - Carousel template options
   * @returns Returns status code `200` and an empty JSON object.
   */
  multicastCarouselTemplate(
    to: string[],
    altText: string,
    columns: LineTypes.ColumnObject[],
    options: LineTypes.CarouselTemplateOptions = {}
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.multicast(to, [
      Line.createCarouselTemplate(altText, columns, options),
    ]);
  }

  /**
   * Multicast Image Carousel Template Message
   *
   * Template with multiple images which can be cycled like a carousel. The images are shown in order when scrolling horizontally.
   *
   * [Official document - image carousel template message](https://developers.line.biz/en/reference/messaging-api/#image-carousel)
   *
   * @param to - Array of user IDs. Use userId values which are returned in [webhook event objects](https://developers.line.biz/en/reference/messaging-api/#common-properties). Do not use LINE IDs found on LINE.
   * - Max: 150 user IDs
   * @param altText - Alternative text
   * @param columns - Array of columns for image carousel
   *
   * Max columns: 10
   *
   * @param options - Common properties for messages
   * @returns Returns status code `200` and an empty JSON object.
   */
  multicastImageCarouselTemplate(
    to: string[],
    altText: string,
    columns: LineTypes.ImageCarouselColumnObject[],
    options?: LineTypes.MessageOptions
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.multicast(to, [
      Line.createImageCarouselTemplate(altText, columns, options),
    ]);
  }

  /**
   * Get Message Content
   *
   * Gets images, videos, audio, and files sent by users.
   *
   * 【No API for retrieving text】
   *
   * You can't use the Messaging API to retrieve text sent by users.
   *
   * [Official document - get content](https://developers.line.biz/en/reference/messaging-api/#get-content)
   *
   * @param messageId - Message ID
   * @returns Returns status code `200` and the content in binary.
   *
   * Content is automatically deleted after a certain period from when the message was sent. There is no guarantee for how long content is stored.
   */
  getMessageContent(messageId: string): Promise<Buffer> {
    return this.dataAxios
      .get(`/v2/bot/message/${messageId}/content`, {
        responseType: 'arraybuffer',
      })
      .then((res) => res.data, handleError);
  }

  getMessageContentStream(messageId: string): Promise<Readable> {
    return this.dataAxios
      .get(`/v2/bot/message/${messageId}/content`, {
        responseType: 'stream',
      })
      .then((res) => res.data, handleError);
  }

  /**
   * `retrieveMessageContent` is deprecated. Use `getMessageContent` instead.
   */
  retrieveMessageContent(messageId: string): Promise<Buffer> {
    warning(
      false,
      '`retrieveMessageContent` is deprecated. Use `getMessageContent` instead.'
    );
    return this.getMessageContent(messageId);
  }

  /**
   * Get User Profile
   *
   * Gets user profile information.
   *
   * [Official document - get user profile](https://developers.line.biz/en/reference/messaging-api/#get-profile)
   *
   * @param userId - User ID that is returned in a [webhook event object](https://developers.line.biz/en/reference/messaging-api/#webhook-event-objects). Do not use the LINE ID found on LINE.Message IDUser ID that is returned in a webhook event object. Do not use the LINE ID found on LINE.
   * @returns Returns status code `200` and a JSON object with the following information.
   *
   * displayName:
   * - User's display name
   *
   * userId:
   * - User ID
   *
   * pictureUrl:
   * - Profile image URL. "https" image URL. Not included in the response if the user doesn't have a profile image.
   *
   * statusMessage:
   * - User's status message. Not included in the response if the user doesn't have a status message.
   */
  getUserProfile(userId: string): Promise<LineTypes.User> {
    return this.axios
      .get(`/v2/bot/profile/${userId}`)
      .then((res) => res.data, handleError)
      .catch((err) => {
        if (err.response && err.response.status === 404) {
          return null;
        }
        return handleError(err);
      });
  }

  /**
   * Get Group Member Profile
   *
   * Gets the user profile of a member of a group that the LINE Official Account is in if the user ID of the group member is known. You can get user profiles of users who have not added the LINE Official Account as a friend or have blocked the LINE Official Account.
   *
   * [Official document - get group member profile](https://developers.line.biz/en/reference/messaging-api/#get-group-member-profile)
   *
   * @param groupId - Group ID. Found in the `source` object of [webhook event objects](https://developers.line.biz/en/reference/messaging-api/#webhook-event-objects).
   * @param userId - User ID. Found in the `source` object of [webhook event objects](https://developers.line.biz/en/reference/messaging-api/#webhook-event-objects). Do not use the LINE ID used in LINE.
   * @returns Returns status code `200` and a JSON object with the following information.
   *
   * displayName:
   * - User's display name
   *
   * userId:
   * - User ID
   *
   * pictureUrl:
   * - Profile image URL. "https" image URL. Not included in the response if the user doesn't have a profile image.
   */
  getGroupMemberProfile(
    groupId: string,
    userId: string
  ): Promise<LineTypes.User> {
    return this.axios
      .get(`/v2/bot/group/${groupId}/member/${userId}`)
      .then((res) => res.data, handleError);
  }

  /**
   * Get Room Member Profile
   *
   * Gets the user profile of a member of a room that the LINE Official Account is in if the user ID of the room member is known. You can get user profiles of users who have not added the LINE Official Account as a friend or have blocked the LINE Official Account.
   *
   * [Official document - get room member profile](https://developers.line.biz/en/reference/messaging-api/#get-room-member-profile)
   *
   * @param roomId - Room ID. Found in the `source` object of [webhook event objects](https://developers.line.biz/en/reference/messaging-api/#webhook-event-objects).
   * @param userId - User ID. Found in the `source` object of [webhook event objects](https://developers.line.biz/en/reference/messaging-api/#webhook-event-objects). Do not use the LINE ID used in LINE.
   * @returns Returns status code `200` and a JSON object with the following information.
   *
   * displayName:
   * - User's display name
   *
   * userId:
   * - User ID
   *
   * pictureUrl:
   * - Profile image URL. "https" image URL. Not included in the response if the user doesn't have a profile image.
   */
  getRoomMemberProfile(
    roomId: string,
    userId: string
  ): Promise<LineTypes.User> {
    return this.axios
      .get(`/v2/bot/room/${roomId}/member/${userId}`)
      .then((res) => res.data, handleError);
  }

  /**
   * Get Group Summary
   *
   * Gets the group ID, group name, and group icon URL of a group where the LINE Official Account is a member.
   *
   * [Official document - get group summary](https://developers.line.biz/en/reference/messaging-api/#get-group-summary)
   *
   * @param groupId - Group ID. Found in the `source` object of [webhook event objects](https://developers.line.biz/en/reference/messaging-api/#webhook-event-objects).
   * @returns Returns status code `200` and a JSON object with the following information.
   *
   * groupId:
   * - Group ID
   *
   * groupName:
   * - Group name
   *
   * pictureUrl:
   * - Group icon URL
   */
  getGroupSummary(groupId: string): Promise<LineTypes.Group> {
    return this.axios
      .get(`/v2/bot/group/${groupId}/summary`)
      .then((res) => res.data, handleError);
  }

  /**
   * Get Members In Group Count
   *
   * Gets the count of members in a group. You can get the member in group count even if the user hasn't added the LINE Official Account as a friend or has blocked the LINE Official Account.
   *
   * [Official document - get members in group count](https://developers.line.biz/en/reference/messaging-api/#get-members-group-count)
   *
   * @param groupId - Group ID. Found in the `source` object of [webhook event objects](https://developers.line.biz/en/reference/messaging-api/#webhook-event-objects).
   * @returns Returns status code `200` and a number representing group member count.
   *
   * count:
   * - The count of members in the group. The number returned excludes the LINE Official Account.
   */
  getGroupMembersCount(groupId: string): Promise<number> {
    return this.axios
      .get(`/v2/bot/group/${groupId}/members/count`)
      .then((res) => res.data.count, handleError);
  }

  /**
   * Get Group Member Ids
   *
   * Gets the user IDs of the members of a group that the bot is in. This includes the user IDs of users who have not added the LINE Official Account as a friend or has blocked the LINE Official Account.
   *
   * This feature is available only to verified or premium accounts. For more information about account types, see the [LINE Account Connect](https://www.linebiz.com/jp-en/service/line-account-connect/) page on the LINE for Business website.
   *
   * [Official document - get group member profile](https://developers.line.biz/en/reference/messaging-api/#get-group-member-profile)
   *
   * @param groupId - Group ID. Found in the `source` object of [webhook event objects](https://developers.line.biz/en/reference/messaging-api/#webhook-event-objects).
   * @param start - Value of the continuation token found in the `next` property of the JSON object returned in the [response](https://developers.line.biz/en/reference/messaging-api/#get-group-member-user-ids-response). Include this parameter to get the next array of user IDs for the members of the group.
   * @returns Returns status code `200` and a JSON object with the following information.
   *
   * memberIds:
   * - List of user IDs of members in the group. Users of LINE version 7.4.x or earlier are not included in `memberIds`. For more information, see [User consent](https://developers.line.biz/en/docs/messaging-api/user-consent/).
   * - Max: 100 user IDs
   *
   * next:
   * - A continuation token to get the next array of user IDs of the members in the group. Returned only when there are remaining user IDs that were not returned in `memberIds` in the original request.
   */
  getGroupMemberIds(
    groupId: string,
    start?: string
  ): Promise<{ memberIds: string[]; next?: string }> {
    return this.axios
      .get(
        `/v2/bot/group/${groupId}/members/ids${start ? `?start=${start}` : ''}`
      )
      .then((res) => res.data, handleError);
  }

  /**
   * Get All Member Ids in the Group
   *
   * Gets the user IDs of the members of a group that the bot is in. This includes the user IDs of users who have not added the LINE Official Account as a friend or has blocked the LINE Official Account.
   *
   * This feature is available only to verified or premium accounts. For more information about account types, see the [LINE Account Connect](https://www.linebiz.com/jp-en/service/line-account-connect/) page on the LINE for Business website.
   *
   * [Official document - get group member profile](https://developers.line.biz/en/reference/messaging-api/#get-group-member-profile)
   *
   * @param groupId - Group ID. Found in the `source` object of [webhook event objects](https://developers.line.biz/en/reference/messaging-api/#webhook-event-objects).
   * @returns Returns status code `200` and a JSON object with the following information.
   *
   * memberIds:
   * - List of user IDs of members in the group. Users of LINE version 7.4.x or earlier are not included in `memberIds`. For more information, see [User consent](https://developers.line.biz/en/docs/messaging-api/user-consent/).
   */
  async getAllGroupMemberIds(groupId: string): Promise<string[]> {
    let allMemberIds: string[] = [];
    let continuationToken;

    do {
      const {
        memberIds,
        next,
      }: // eslint-disable-next-line no-await-in-loop
      { memberIds: string[]; next?: string } = await this.getGroupMemberIds(
        groupId,
        continuationToken
      );

      allMemberIds = allMemberIds.concat(memberIds);
      continuationToken = next;
    } while (continuationToken);

    return allMemberIds;
  }

  /**
   * Get Members In Room Count
   *
   * Gets the count of members in a room. You can get the member in room count even if the user hasn't added the LINE Official Account as a friend or has blocked the LINE Official Account.
   *
   * [Official document - get members in room count](https://developers.line.biz/en/reference/messaging-api/#get-members-room-count)
   *
   * @param roomId - Room ID. Found in the `source` object of [webhook event objects](https://developers.line.biz/en/reference/messaging-api/#webhook-event-objects).
   * @returns Returns status code `200` and a number representing room member count.
   *
   * count:
   * - The count of members in the group. The number returned excludes the LINE Official Account.
   */
  getRoomMembersCount(roomId: string): Promise<number> {
    return this.axios
      .get(`/v2/bot/room/${roomId}/members/count`)
      .then((res) => res.data.count, handleError);
  }

  /**
   * Get Room Member Ids
   *
   * Gets the user IDs of the members of a room that the LINE Official Account is in. This includes the user IDs of users who have not added the LINE Official Account as a friend or have blocked the LINE Official Account.
   *
   * This feature is available only to verified or premium accounts. For more information about account types, see the [LINE Account Connect](https://www.linebiz.com/jp-en/service/line-account-connect/) page on the LINE for Business website.
   *
   * [Official document - get room member profile](https://developers.line.biz/en/reference/messaging-api/#get-room-member-user-ids)
   *
   * @param roomId - Room ID. Found in the `source` object of [webhook event objects](https://developers.line.biz/en/reference/messaging-api/#webhook-event-objects).
   * @param start - Value of the continuation token found in the `next` property of the JSON object returned in the [response](https://developers.line.biz/en/reference/messaging-api/#get-room-member-user-ids-response). Include this parameter to get the next array of user IDs for the members of the group.
   * @returns Returns status code `200` and a JSON object with the following information.
   *
   * memberIds:
   * - List of user IDs of members in the room. Users of LINE version 7.4.x or earlier are not included in `memberIds`. For more information, see [User consent](https://developers.line.biz/en/docs/messaging-api/user-consent/).
   * - Max: 100 user IDs
   *
   * next:
   * - A continuation token to get the next array of user IDs of the members in the room. Returned only when there are remaining user IDs that were not returned in `memberIds` in the original request.
   */
  getRoomMemberIds(
    roomId: string,
    start?: string
  ): Promise<{ memberIds: string[]; next?: string }> {
    return this.axios
      .get(
        `/v2/bot/room/${roomId}/members/ids${start ? `?start=${start}` : ''}`
      )
      .then((res) => res.data, handleError);
  }

  /**
   * Get All Member Ids in the Room
   *
   * Gets the user IDs of the members of a room that the LINE Official Account is in. This includes the user IDs of users who have not added the LINE Official Account as a friend or have blocked the LINE Official Account.
   *
   * This feature is available only to verified or premium accounts. For more information about account types, see the [LINE Account Connect](https://www.linebiz.com/jp-en/service/line-account-connect/) page on the LINE for Business website.
   *
   * [Official document - get room member profile](https://developers.line.biz/en/reference/messaging-api/#get-room-member-user-ids)
   *
   * @param roomId - Room ID. Found in the `source` object of [webhook event objects](https://developers.line.biz/en/reference/messaging-api/#webhook-event-objects).
   * @returns Returns status code `200` and a JSON object with the following information.
   *
   * memberIds:
   * - List of user IDs of members in the room. Users of LINE version 7.4.x or earlier are not included in `memberIds`. For more information, see [User consent](https://developers.line.biz/en/docs/messaging-api/user-consent/).
   */
  async getAllRoomMemberIds(roomId: string): Promise<string[]> {
    let allMemberIds: string[] = [];
    let continuationToken;

    do {
      const {
        memberIds,
        next,
      }: // eslint-disable-next-line no-await-in-loop
      { memberIds: string[]; next?: string } = await this.getRoomMemberIds(
        roomId,
        continuationToken
      );

      allMemberIds = allMemberIds.concat(memberIds);
      continuationToken = next;
    } while (continuationToken);

    return allMemberIds;
  }

  /**
   * Leave Group
   *
   * Leaves a [group](https://developers.line.biz/en/docs/messaging-api/group-chats/#group).
   *
   * [Official document - leave group](https://developers.line.biz/en/reference/messaging-api/#leave-group)
   *
   * @param groupId - Group ID. Found in the `source` object of [webhook event objects](https://developers.line.biz/en/reference/messaging-api/#webhook-event-objects).
   * @returns Returns status code `200` and an empty JSON object.
   */
  leaveGroup(groupId: string): Promise<LineTypes.MutationSuccessResponse> {
    return this.axios
      .post(`/v2/bot/group/${groupId}/leave`, null)
      .then((res) => res.data, handleError);
  }

  /**
   * Leave Room
   *
   * Leaves a [room](https://developers.line.biz/en/docs/messaging-api/group-chats/#room).
   *
   * [Official document - leave room](https://developers.line.biz/en/reference/messaging-api/#leave-room)
   *
   * @param roomId - Room ID. Found in the `source` object of [webhook event objects](https://developers.line.biz/en/reference/messaging-api/#webhook-event-objects).
   * @returns Returns status code `200` and an empty JSON object.
   */
  leaveRoom(roomId: string): Promise<LineTypes.MutationSuccessResponse> {
    return this.axios
      .post(`/v2/bot/room/${roomId}/leave`, null)
      .then((res) => res.data, handleError);
  }

  /**
   * Get Rich Menu List
   *
   * Gets a list of the rich menu response object of all rich menus created by [Create a rich menu](https://developers.line.biz/en/reference/messaging-api/#create-rich-menu).
   *
   * You can't retrieve rich menus created with LINE Official Account Manager.
   *
   * [Official document - get rich menu list](https://developers.line.biz/en/reference/messaging-api/#get-rich-menu-list)
   *
   * @returns Returns status code `200` and a list of [rich menu response objects](https://developers.line.biz/en/reference/messaging-api/#rich-menu-response-object).
   *
   * richmenus:
   * Array of [rich menu response objects](https://developers.line.biz/en/reference/messaging-api/#rich-menu-response-object)
   */
  getRichMenuList(): Promise<LineTypes.RichMenu[]> {
    return this.axios
      .get('/v2/bot/richmenu/list')
      .then((res) => res.data.richmenus, handleError);
  }

  /**
   * Get Rich Menu
   *
   * Gets a rich menu via a rich menu ID.
   *
   * [Official document - get rich menu](https://developers.line.biz/en/reference/messaging-api/#get-rich-menu)
   *
   * @param richMenuId - ID of a rich menu
   * @returns Returns status code `200` and a [rich menu response objects](https://developers.line.biz/en/reference/messaging-api/#rich-menu-response-object).
   *
   * richmenus:
   * Array of [rich menu response objects](https://developers.line.biz/en/reference/messaging-api/#rich-menu-response-object)
   */
  getRichMenu(richMenuId: string): Promise<LineTypes.RichMenu> {
    return this.axios
      .get(`/v2/bot/richmenu/${richMenuId}`)
      .then((res) => res.data)
      .catch((err) => {
        if (err.response && err.response.status === 404) {
          return null;
        }
        return handleError(err);
      });
  }

  /**
   * Create Rich Menu
   *
   * Creates a rich menu.
   *
   * You must [upload a rich menu image](https://developers.line.biz/en/reference/messaging-api/#upload-rich-menu-image), and [set the rich menu as the default rich menu](https://developers.line.biz/en/reference/messaging-api/#set-default-rich-menu) or [link the rich menu to a user](https://developers.line.biz/en/reference/messaging-api/#link-rich-menu-to-user) for the rich menu to be displayed. You can create up to 1000 rich menus for one LINE Official Account with the Messaging API.
   *
   * [Official document - create rich menu](https://developers.line.biz/en/reference/messaging-api/#create-rich-menu)
   *
   * @param richMenu - The rich menu represented as a rich menu object.
   * @returns Returns status code `200` and a JSON object with the rich menu ID.
   */
  createRichMenu(
    richMenu: LineTypes.RichMenu
  ): Promise<{ richMenuId: string }> {
    return this.axios
      .post('/v2/bot/richmenu', richMenu)
      .then((res) => res.data, handleError);
  }

  /**
   * Delete Rich Menu
   *
   * Deletes a rich menu.
   *
   * If you have reached the maximum of 1,000 rich menus with the Messaging API for your LINE Official Account, you must delete a rich menu before you can create a new one.
   *
   * [Official document - delete rich menu](https://developers.line.biz/en/reference/messaging-api/#delete-rich-menu)
   *
   * @param richMenuId - ID of a rich menu
   * @returns Returns status code `200` and an empty JSON object.
   */
  deleteRichMenu(
    richMenuId: string
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.axios
      .delete(`/v2/bot/richmenu/${richMenuId}`)
      .then((res) => res.data, handleError);
  }

  /**
   * Get Linked Rich Menu
   *
   * Gets the ID of the rich menu linked to a user.
   *
   * [Official document - get rich menu id of user](https://developers.line.biz/en/reference/messaging-api/#get-rich-menu-id-of-user)
   *
   * @param userId - User ID. Found in the `source` object of [webhook event objects](https://developers.line.biz/en/reference/messaging-api/#webhook-event-objects). Do not use the LINE ID used in LINE.
   * @returns Returns status code `200` and a JSON object with the rich menu ID.
   */
  getLinkedRichMenu(userId: string): Promise<{ richMenuId: string }> {
    return this.axios
      .get(`/v2/bot/user/${userId}/richmenu`)
      .then((res) => res.data)
      .catch((err) => {
        if (err.response && err.response.status === 404) {
          return null;
        }
        return handleError(err);
      });
  }

  /**
   * Link Rich Menu
   *
   * Links a rich menu to a user. Only one rich menu can be linked to a user at one time. If a user already has a rich menu linked, calling this endpoint replaces the existing rich menu with the one specified in your request.
   *
   * The rich menu is displayed in the following order of priority (highest to lowest):
   *
   * 1. The per-user rich menu set with the Messaging API
   * 2. The [default rich menu set with the Messaging API](https://developers.line.biz/en/reference/messaging-api/#set-default-rich-menu)
   * 3. The [default rich menu set with LINE Official Account Manager](https://developers.line.biz/en/docs/messaging-api/using-rich-menus/#creating-a-rich-menu-with-the-line-manager)
   *
   * [Official document - link rich menu to user](https://developers.line.biz/en/reference/messaging-api/#link-rich-menu-to-user)
   *
   * @param userId - User ID. Found in the `source` object of [webhook event objects](https://developers.line.biz/en/reference/messaging-api/#webhook-event-objects). Do not use the LINE ID used in LINE.
   * @param richMenuId - ID of a rich menu
   * @returns Returns status code `200` and an empty JSON object.
   */
  linkRichMenu(
    userId: string,
    richMenuId: string
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.axios
      .post(`/v2/bot/user/${userId}/richmenu/${richMenuId}`, null)
      .then((res) => res.data, handleError);
  }

  /**
   * Unlink Rich Menu
   *
   * Unlinks a rich menu from a user.
   *
   * [Official document - unlink rich menu from user](https://developers.line.biz/en/reference/messaging-api/#unlink-rich-menu-from-user)
   *
   * @param userId - User ID. Found in the `source` object of [webhook event objects](https://developers.line.biz/en/reference/messaging-api/#webhook-event-objects). Do not use the LINE ID used in LINE.
   * @returns Returns status code `200` and an empty JSON object.
   */
  unlinkRichMenu(userId: string): Promise<LineTypes.MutationSuccessResponse> {
    return this.axios
      .delete(`/v2/bot/user/${userId}/richmenu`)
      .then((res) => res.data, handleError);
  }

  /**
   * Get Default Rich Menu
   *
   * Gets the ID of the default rich menu set with the Messaging API.
   *
   * [Official document - get default rich menu id](https://developers.line.biz/en/reference/messaging-api/#get-default-rich-menu-id)
   *
   * @returns Returns status code `200` and a JSON object with the rich menu ID.
   */
  getDefaultRichMenu(): Promise<{ richMenuId: string }> {
    return this.axios
      .get(`/v2/bot/user/all/richmenu`)
      .then((res) => res.data)
      .catch((err) => {
        if (err.response && err.response.status === 404) {
          return null;
        }
        return handleError(err);
      });
  }

  /**
   * Set Default Rich Menu
   *
   * Sets the default rich menu. The default rich menu is displayed to all users who have added your LINE Official Account as a friend and are not linked to any per-user rich menu. If a default rich menu has already been set, calling this endpoint replaces the current default rich menu with the one specified in your request.
   *
   * The rich menu is displayed in the following order of priority (highest to lowest):
   *
   * 1. [The per-user rich menu set with the Messaging API](https://developers.line.biz/en/reference/messaging-api/#link-rich-menu-to-user)
   * 2. The default rich menu set with the Messaging API
   * 3. [The default rich menu set with LINE Official Account Manager](https://developers.line.biz/en/docs/messaging-api/using-rich-menus/#creating-a-rich-menu-with-the-line-manager)
   *
   * [Official document - set default rich menu](https://developers.line.biz/en/reference/messaging-api/#set-default-rich-menu)
   *
   * @param richMenuId - ID of a rich menu
   * @returns Returns status code `200` and an empty JSON object.
   */
  setDefaultRichMenu(
    richMenuId: string
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.axios
      .post(`/v2/bot/user/all/richmenu/${richMenuId}`, null)
      .then((res) => res.data, handleError);
  }

  /**
   * Delete Default Rich Menu
   *
   * Cancels the default rich menu set with the Messaging API.
   *
   * [Official document - cancel default rich menu](https://developers.line.biz/en/reference/messaging-api/#cancel-default-rich-menu)
   *
   * @returns Returns status code `200` and a JSON object with the rich menu ID.
   */
  deleteDefaultRichMenu(): Promise<{ richMenuId: string }> {
    return this.axios
      .delete(`/v2/bot/user/all/richmenu`)
      .then((res) => res.data, handleError);
  }

  /**
   * Upload Rich Menu Image
   *
   * Uploads and attaches an image to a rich menu.
   *
   * You can use rich menu images with the following specifications:
   *
   * - Image format: JPEG or PNG
   * - Image size (pixels): 2500x1686, 2500x843, 1200x810, 1200x405, 800x540, 800x270
   * - Max file size: 1 MB
   *
   * Note: You cannot replace an image attached to a rich menu. To update your rich menu image, create a new rich menu object and upload another image.
   *
   * [Official document - upload rich menu image](https://developers.line.biz/en/reference/messaging-api/#upload-rich-menu-image)
   *
   * @param richMenuId - The ID of the rich menu to attach the image to
   * @param image - image
   * @returns Returns status code `200` and an empty JSON object.
   */
  uploadRichMenuImage(
    richMenuId: string,
    image: Buffer
  ): Promise<LineTypes.MutationSuccessResponse> {
    const type = imageType(image);
    invariant(
      type && (type.mime === 'image/jpeg' || type.mime === 'image/png'),
      'Image must be `image/jpeg` or `image/png`'
    );

    return this.dataAxios
      .post(`/v2/bot/richmenu/${richMenuId}/content`, image, {
        headers: {
          'Content-Type': (type as { mime: string }).mime,
        },
      })
      .then((res) => res.data, handleError);
  }

  /**
   * Download Rich Menu Image
   *
   * Downloads an image associated with a rich menu.
   *
   * [Official document - download rich menu image](https://developers.line.biz/en/reference/messaging-api/#download-rich-menu-image)
   *
   * @param richMenuId - ID of the rich menu with the image to be downloaded
   * @returns Returns status code `200` and the binary data of the rich menu image. The image can be downloaded as shown in the example request.
   */
  downloadRichMenuImage(richMenuId: string): Promise<Buffer | undefined> {
    return this.dataAxios
      .get(`/v2/bot/richmenu/${richMenuId}/content`, {
        responseType: 'arraybuffer',
      })
      .then((res) => Buffer.from(res.data))
      .catch((err) => {
        if (err.response && err.response.status === 404) {
          return undefined;
        }
        return handleError(err);
      });
  }

  /**
   * `issueLinkToken` is deprecated. Use `getLinkToken` instead. Note: It returns a string instead of an object.
   */
  issueLinkToken(userId: string): Promise<{ linkToken: string }> {
    warning(
      false,
      '`issueLinkToken` is deprecated. Use `getLinkToken` instead. Note: It returns a string instead of an object.'
    );
    return this.axios
      .post<{ linkToken: string }>(`/v2/bot/user/${userId}/linkToken`, null)
      .then((res) => res.data, handleError);
  }

  /**
   * Get Account link
   *
   * Issues a link token used for the [account link](https://developers.line.biz/en/docs/messaging-api/linking-accounts/) feature.
   *
   * [Official document - issue link token](https://developers.line.biz/en/reference/messaging-api/#issue-link-token)
   *
   * @param userId - User ID for the LINE account to be linked. Found in the `source` object of [account link event objects](https://developers.line.biz/en/reference/messaging-api/#account-link-event). Do not use the LINE ID used in LINE.
   * @returns Returns status code `200` and a link token. Link tokens are valid for 10 minutes and can only be used once.
   *
   * Note: The validity period may change without notice.
   */
  getLinkToken(userId: string): Promise<string> {
    return this.axios
      .post<{ linkToken: string }>(`/v2/bot/user/${userId}/linkToken`, null)
      .then((res) => res.data.linkToken, handleError);
  }

  /**
   * LINE Front-end Framework (LIFF)
   */

  /**
   * Get LIFF App List (LIFF v1)
   *
   * Gets information on all the LIFF apps registered in the channel.
   *
   * [Official document - get all liff apps](https://developers.line.biz/en/reference/liff-v1/#get-all-liff-apps)
   *
   * @returns Returns status code `200` and a JSON object with the following properties.
   */
  getLiffAppList(): Promise<LineTypes.LiffApp[]> {
    return this.axios
      .get('/liff/v1/apps')
      .then((res) => res.data.apps, handleError);
  }

  /**
   * Create LIFF App (LIFF v1)
   *
   * Adds the LIFF app to a channel. You can add up to 30 LIFF apps on one channel.
   *
   * [Official document - add liff app](https://developers.line.biz/en/reference/liff-v1/#add-liff-app)
   *
   * @param liffApp - LIFF app settings
   * @returns Returns status code `200` and a JSON object with the following properties.
   *
   * liffId:
   * - LIFF app ID
   */
  createLiffApp(liffApp: LineTypes.LiffApp): Promise<{ liffId: string }> {
    return this.axios
      .post('/liff/v1/apps', liffApp)
      .then((res) => res.data, handleError);
  }

  /**
   * Update LIFF App (LIFF v1)
   *
   * Partially updates LIFF app settings.
   *
   * [Official document - update liff app](https://developers.line.biz/en/reference/liff-v1/#update-liff-app)
   *
   * @param liffId - ID of the LIFF app to be updated
   * @param liffApp - Partial LIFF app settings. Only the properties specified in the request body are updated.
   * @returns Status code `200` is returned.
   */
  updateLiffApp(
    liffId: string,
    liffApp: LineTypes.PartialLiffApp
  ): Promise<void> {
    return this.axios
      .put(`/liff/v1/apps/${liffId}/view`, liffApp)
      .then((res) => res.data, handleError);
  }

  /**
   * Delete LIFF App (LIFF v1)
   *
   * Deletes a LIFF app from a channel.
   *
   * [Official document - delete liff app](https://developers.line.biz/en/reference/liff-v1/#delete-liff-app)
   *
   * @param liffId - ID of the LIFF app to be deleted
   * @returns Status code `200` is returned.
   */
  deleteLiffApp(liffId: string): Promise<void> {
    return this.axios
      .delete(`/liff/v1/apps/${liffId}`)
      .then((res) => res.data, handleError);
  }

  /**
   * Get number of messages sent
   *
   */

  /**
   * Get Target Limit For Additional Messages
   *
   * Gets the target limit for additional messages in the current month.
   *
   * The number of messages retrieved by this operation includes the number of messages sent from LINE Official Account Manager.
   *
   * Set a target limit with LINE Official Account Manager. For the procedures, refer to the LINE Official Account Manager manual.
   *
   * Note: LINE\@ accounts cannot call this API endpoint.
   *
   * [Official document - get quota](https://developers.line.biz/en/reference/messaging-api/#get-quota)
   *
   * @returns Returns status code `200` and a [[TargetLimitForAdditionalMessages]].
   */
  getTargetLimitForAdditionalMessages(): Promise<
    LineTypes.TargetLimitForAdditionalMessages
  > {
    return this.axios
      .get<LineTypes.TargetLimitForAdditionalMessages>('/v2/bot/message/quota')
      .then((res) => res.data, handleError);
  }

  /**
   * Get Number of Messages Sent This Month
   *
   * Gets the number of messages sent in the current month.
   *
   * The number of messages retrieved by this operation includes the number of messages sent from LINE Official Account Manager.
   *
   * The number of messages retrieved by this operation is approximate. To get the correct number of sent messages, use LINE Official Account Manager or execute API operations for getting the number of sent messages.
   *
   * Note: LINE\@ accounts cannot call this API endpoint.
   *
   * [Official document - get consumption](https://developers.line.biz/en/reference/messaging-api/#get-consumption)
   *
   * @returns Returns status code `200` and a [[NumberOfMessagesSentThisMonth]].
   */
  getNumberOfMessagesSentThisMonth(): Promise<
    LineTypes.NumberOfMessagesSentThisMonth
  > {
    return this.axios
      .get<LineTypes.NumberOfMessagesSentThisMonth>(
        '/v2/bot/message/quota/consumption'
      )
      .then((res) => res.data, handleError);
  }

  /**
   * Get Number of Sent Reply Messages
   *
   * Gets the number of messages sent with the `/bot/message/reply` endpoint.
   *
   * The number of messages retrieved by this operation does not include the number of messages sent from LINE Official Account Manager.
   *
   * [Official document - get number of reply messages](https://developers.line.biz/en/reference/messaging-api/#get-number-of-reply-messages)
   *
   * @param date - Date the messages were sent
   *
   * - Format: yyyyMMdd (Example: 20191231)
   * - Timezone: UTC+9
   *
   * @returns Returns status code `200` and a [[NumberOfMessagesSentResponse]].
   */
  getNumberOfSentReplyMessages(
    date: string
  ): Promise<LineTypes.NumberOfMessagesSentResponse> {
    return this.axios
      .get<LineTypes.NumberOfMessagesSentResponse>(
        '/v2/bot/message/delivery/reply',
        {
          params: {
            date,
          },
        }
      )
      .then((res) => res.data, handleError);
  }

  /**
   * Get Number of Sent Push Messages
   *
   * Gets the number of messages sent with the `/bot/message/push` endpoint.
   *
   * The number of messages retrieved by this operation does not include the number of messages sent from LINE Official Account Manager.
   *
   * Note: LINE\@ accounts under the free or basic plan cannot call this API endpoint.
   *
   * [Official document - get number of push messages](https://developers.line.biz/en/reference/messaging-api/#get-number-of-push-messages)
   *
   * @param date - Date the messages were sent
   *
   * - Format: yyyyMMdd (Example: 20191231)
   * - Timezone: UTC+9
   *
   * @returns Returns status code `200` and a [[NumberOfMessagesSentResponse]].
   */
  getNumberOfSentPushMessages(
    date: string
  ): Promise<LineTypes.NumberOfMessagesSentResponse> {
    return this.axios
      .get<LineTypes.NumberOfMessagesSentResponse>(
        '/v2/bot/message/delivery/push',
        {
          params: {
            date,
          },
        }
      )
      .then((res) => res.data, handleError);
  }

  /**
   * Get Number of Sent Multicast Messages
   *
   * Gets the number of messages sent with the `/bot/message/multicast` endpoint.
   *
   * The number of messages retrieved by this operation does not include the number of messages sent from LINE Official Account Manager.
   *
   * Note: LINE\@ accounts under the free or basic plan cannot call this API endpoint.
   *
   * [Official document - get number of multicast messages](https://developers.line.biz/en/reference/messaging-api/#get-number-of-multicast-messages)
   *
   * @param date - Date the messages were sent
   *
   * - Format: yyyyMMdd (Example: 20191231)
   * - Timezone: UTC+9
   *
   * @returns Returns status code `200` and a [[NumberOfMessagesSentResponse]].
   */
  getNumberOfSentMulticastMessages(
    date: string
  ): Promise<LineTypes.NumberOfMessagesSentResponse> {
    return this.axios
      .get<LineTypes.NumberOfMessagesSentResponse>(
        '/v2/bot/message/delivery/multicast',
        {
          params: {
            date,
          },
        }
      )
      .then((res) => res.data, handleError);
  }

  /**
   * Get Number of Sent Broadcast Messages
   *
   * Gets the number of messages sent with the `/bot/message/broadcast` endpoint.
   *
   * The number of messages retrieved by this operation does not include the number of messages sent from LINE Official Account Manager.
   *
   * 【LINE Official Account migration】
   *
   * You can't call this API with a LINE\@ account or LINE Official Account that hasn't been migrated to the account plans implemented on April 18, 2019. Please migrate your account first. For more information, see [Migration of LINE\@ accounts](https://developers.line.biz/en/docs/messaging-api/migrating-line-at/).
   *
   * [Official document - get number of broadcast messages](https://developers.line.biz/en/reference/messaging-api/#get-number-of-broadcast-messages)
   *
   * @param date - Date the messages were sent
   *
   * - Format: yyyyMMdd (Example: 20191231)
   * - Timezone: UTC+9
   *
   * @returns Returns status code `200` and a [[NumberOfMessagesSentResponse]].
   */
  getNumberOfSentBroadcastMessages(
    date: string
  ): Promise<LineTypes.NumberOfMessagesSentResponse> {
    return this.axios
      .get<LineTypes.NumberOfMessagesSentResponse>(
        '/v2/bot/message/delivery/broadcast',
        {
          params: {
            date,
          },
        }
      )
      .then((res) => res.data, handleError);
  }

  /**
   * Insight
   * https://developers.line.biz/en/reference/messaging-api/#get-insight
   */

  /**
   * Get Number of Delivery Messages
   *
   * Returns the number of messages sent from LINE Official Account on a specified day.
   *
   * 【LINE Official Account migration】
   *
   * You can't call this API with a LINE\@ account or LINE Official Account that hasn't been migrated to the account plans implemented on April 18, 2019. Please migrate your account first. For more information, see [Migration of LINE\@ accounts](https://developers.line.biz/en/docs/messaging-api/migrating-line-at/).
   *
   * [Official document - get number of delivery messages](https://developers.line.biz/en/reference/messaging-api/#get-number-of-delivery-messages)
   *
   * @param date - Date for which to retrieve number of sent messages.
   *
   * - Format: yyyyMMdd (Example: 20191231)
   * - Timezone: UTC+9
   *
   * @returns Returns status code `200` and a [[NumberOfMessageDeliveriesResponse]].
   */
  getNumberOfMessageDeliveries(
    date: string
  ): Promise<LineTypes.NumberOfMessageDeliveriesResponse> {
    return this.axios
      .get<LineTypes.NumberOfMessageDeliveriesResponse>(
        '/v2/bot/insight/message/delivery',
        {
          params: {
            date,
          },
        }
      )
      .then((res) => res.data, handleError);
  }

  /**
   * Get Number of Followers
   *
   * Returns the number of users who have added the LINE Official Account on or before a specified date.
   *
   * 【LINE Official Account migration】
   *
   * You can't call this API with a LINE\@ account or LINE Official Account that hasn't been migrated to the account plans implemented on April 18, 2019. Please migrate your account first. For more information, see [Migration of LINE\@ accounts](https://developers.line.biz/en/docs/messaging-api/migrating-line-at/).
   *
   * [Official document - get number of followers](https://developers.line.biz/en/reference/messaging-api/#get-number-of-followers)
   *
   * @param date - Date for which to retrieve the number of followers.
   *
   * - Format: yyyyMMdd (Example: 20191231)
   * - Timezone: UTC+9
   *
   * @returns Returns status code `200` and a [[NumberOfFollowersResponse]].
   */
  getNumberOfFollowers(
    date: string
  ): Promise<LineTypes.NumberOfFollowersResponse> {
    return this.axios
      .get<LineTypes.NumberOfFollowersResponse>('/v2/bot/insight/followers', {
        params: {
          date,
        },
      })
      .then((res) => res.data, handleError);
  }

  /**
   * Get Friend Demographics
   *
   * Retrieves the demographic attributes for a LINE Official Account's friends. You can only retrieve information about friends for LINE Official Accounts created by users in Japan (JP), Thailand (TH) and Taiwan (TW).
   *
   * 【LINE Official Account migration】
   *
   * You can't call this API with a LINE\@ account or LINE Official Account that hasn't been migrated to the account plans implemented on April 18, 2019. Please migrate your account first. For more information, see [Migration of LINE\@ accounts](https://developers.line.biz/en/docs/messaging-api/migrating-line-at/).
   *
   * Not real-time data
   *
   * It can take up to 3 days for demographic information to be calculated. This means the information the API returns may be 3 days old. Furthermore, your ["Target reach"](https://developers.line.biz/en/docs/glossary/#target-reach) number must be at least 20 to retrieve demographic information.
   *
   * [Official document - get number of followers](https://developers.line.biz/en/reference/messaging-api/#get-demographic)
   *
   * @returns Returns status code `200` and a [[FriendDemographics]].
   */
  getFriendDemographics(): Promise<LineTypes.FriendDemographics> {
    return this.axios
      .get<LineTypes.FriendDemographics>('/v2/bot/insight/demographic')
      .then((res) => res.data, handleError);
  }

  /**
   * Narrowcast Message
   */

  /**
   * Send Narrowcast Message
   *
   * Sends a push message to multiple users. You can specify recipients using attributes (such as age, gender, OS, and region) or by retargeting (audiences). Messages cannot be sent to groups or rooms.
   *
   *  LINE Official Account migration
   *
   * You can't call this API with a LINE\@ account or LINE Official Account that hasn't been migrated to the account plans implemented on April 18, 2019. Please migrate your account first. For more information, see [Migration of LINE\@ accounts](https://developers.line.biz/en/docs/messaging-api/migrating-line-at/).
   *
   * [Official document - send narrowcast message](https://developers.line.biz/en/reference/messaging-api/#send-narrowcast-message)
   *
   * @param body - Request body
   * @param body.messages - Messages to send
   * - Max: 5
   * @param body.recipient - [[RecipientObject]]. You can specify recipients of the message using up to 10 audiences.
   *
   * If this is omitted, messages will be sent to all users who have added your LINE Official Account as a friend.
   * @param body.filter - demographic:
   * - [[DemographicFilterObject]].
   * - You can use friends' attributes to filter the list of recipients.
   *
   * If this is omitted, messages are sent to everyone—including users with attribute values of "unknown".
   * @param body.limit - max:
   * - The maximum number of narrowcast messages to send.
   * - Use this parameter to limit the number of narrowcast messages sent. The recipients will be chosen at random.
   *
   * @returns Returns the `202` HTTP status code and a JSON object with the following information.
   *
   * requestId: string
   * - The narrowcast message's request ID
   *
   * For more information on how to check the status of a narrowcast message, see [Get narrowcast message status](https://developers.line.biz/en/reference/messaging-api/#get-narrowcast-progress-status).
   */
  narrowcastRawBody(body: {
    messages: LineTypes.Message[];
    recipient?: LineTypes.RecipientObject;
    filter?: { demographic: LineTypes.DemographicFilterObject };
    limit?: {
      max: number;
    };
  }): Promise<{ requestId: string }> {
    return this.axios.post('/v2/bot/message/narrowcast', body).then((res) => {
      return {
        requestId: res.headers['x-line-request-id'],
        ...res.data,
      };
    }, handleError);
  }

  /**
   * Send Narrowcast Message
   *
   * Sends a push message to multiple users. You can specify recipients using attributes (such as age, gender, OS, and region) or by retargeting (audiences). Messages cannot be sent to groups or rooms.
   *
   *  LINE Official Account migration
   *
   * You can't call this API with a LINE\@ account or LINE Official Account that hasn't been migrated to the account plans implemented on April 18, 2019. Please migrate your account first. For more information, see [Migration of LINE\@ accounts](https://developers.line.biz/en/docs/messaging-api/migrating-line-at/).
   *
   * [Official document - send narrowcast message](https://developers.line.biz/en/reference/messaging-api/#send-narrowcast-message)
   *
   * @param messages - Messages to send
   * - Max: 5
   * @param options - Narrowcast options
   * @returns Returns the `202` HTTP status code and a JSON object with the following information.
   *
   * requestId: string
   * - The narrowcast message's request ID
   *
   * For more information on how to check the status of a narrowcast message, see [Get narrowcast message status](https://developers.line.biz/en/reference/messaging-api/#get-narrowcast-progress-status).
   */
  narrowcast(
    messages: LineTypes.Message[],
    options?: LineTypes.NarrowcastOptions
  ): Promise<{ requestId: string }> {
    const filter = options?.demographic
      ? {
          demographic: options.demographic,
        }
      : undefined;
    const limit = options?.max
      ? {
          max: options?.max,
        }
      : undefined;
    return this.narrowcastRawBody({
      messages,
      recipient: options?.recipient,
      filter,
      limit,
    });
  }

  /**
   * Send Narrowcast Message
   *
   * Sends a push message to multiple users. You can specify recipients using attributes (such as age, gender, OS, and region) or by retargeting (audiences). Messages cannot be sent to groups or rooms.
   *
   *  LINE Official Account migration
   *
   * You can't call this API with a LINE\@ account or LINE Official Account that hasn't been migrated to the account plans implemented on April 18, 2019. Please migrate your account first. For more information, see [Migration of LINE\@ accounts](https://developers.line.biz/en/docs/messaging-api/migrating-line-at/).
   *
   * [Official document - send narrowcast message](https://developers.line.biz/en/reference/messaging-api/#send-narrowcast-message)
   *
   * @param messages - Messages to send
   * - Max: 5
   * @param options - Narrowcast options
   * @returns Returns the `202` HTTP status code and a JSON object with the following information.
   *
   * requestId: string
   * - The narrowcast message's request ID
   *
   * For more information on how to check the status of a narrowcast message, see [Get narrowcast message status](https://developers.line.biz/en/reference/messaging-api/#get-narrowcast-progress-status).
   */
  narrowcastMessages(
    messages: LineTypes.Message[],
    options?: LineTypes.NarrowcastOptions
  ): Promise<{ requestId: string }> {
    return this.narrowcast(messages, options);
  }

  /**
   * Get Narrowcast Message Status
   *
   * Gets the status of a narrowcast message.
   *
   * 【LINE Official Account migration】
   *
   * You can't call this API with a LINE\@ account or LINE Official Account that hasn't been migrated to the account plans implemented on April 18, 2019. Please migrate your account first. For more information, see [Migration of LINE\@ accounts](https://developers.line.biz/en/docs/messaging-api/migrating-line-at/).
   *
   * 【Messages must have a minimum number of recipients】
   *
   * Narrowcast messages cannot be sent when the number of recipients is below a certain minimum amount, to prevent someone from guessing the recipients' attributes. The minimum number of recipients is a private value defined by the LINE Platform.
   *
   * 【Window of availability for status requests】
   *
   * You can get the status of a narrowcast message for up to 7 days after you have requested that it be sent.
   *
   * [Official document - get narrowcast progress status](https://developers.line.biz/en/reference/messaging-api/#get-narrowcast-progress-status)
   *
   * @param requestId - The narrowcast message's request ID. Each Messaging API request has a request ID.
   * @returns Returns a `200` HTTP status code and a [[NarrowcastProgressResponse]]
   */
  getNarrowcastProgress(
    requestId: string
  ): Promise<LineTypes.NarrowcastProgressResponse> {
    return this.axios
      .get(`/v2/bot/message/progress/narrowcast?requestId=${requestId}`)
      .then((res) => res.data, handleError);
  }

  /**
   * Audience
   *
   */

  /**
   * Create Upload Audience Group
   *
   * Creates an audience for uploading user IDs. You can create up to 1,000 audiences.
   *
   * Get user IDs via these methods:
   *
   * - Use the `source` property of a [webhook event object](https://developers.line.biz/en/reference/messaging-api/#webhook-event-objects).
   * - [Get group member user IDs](https://developers.line.biz/en/reference/messaging-api/#get-group-member-user-ids)
   * - [Get room member user IDs](https://developers.line.biz/en/reference/messaging-api/#get-room-member-user-ids)
   *
   * 【You must complete additional application forms to specify recipients using Identifiers for Advertisers (IFAs)】
   *
   * You must complete some additional application forms before you can use IFAs to specify recipients. For more information, contact your LINE representative or submit an inquiry through the [LINE for Business](https://www.linebiz.com/) website.
   *
   * [Official document - create upload audience group](https://developers.line.biz/en/reference/messaging-api/#create-upload-audience-group)
   *
   * @param description - The audience's name. Audience names must be unique. Note that comparisons are case-insensitive, so the names `AUDIENCE` and `audience` are considered identical.
   * - Max character limit: 120
   * @param isIfaAudience - If this is `false` (default), recipients are specified by user IDs. If `true`, recipients must be specified by IFAs.
   * @param audiences - An array of up to 10,000 user IDs or IFAs.
   * @param options - Create upload audience group options.
   * @returns Returns an [[UploadAudienceGroup]] along with the `202` HTTP status code.
   */
  createUploadAudienceGroup(
    description: string,
    isIfaAudience: boolean,
    audiences: LineTypes.Audience[],
    options: LineTypes.CreateUploadAudienceGroupOptions = {}
  ): Promise<LineTypes.UploadAudienceGroup> {
    return this.axios
      .post('/v2/bot/audienceGroup/upload', {
        description,
        isIfaAudience,
        audiences,
        ...options,
      })
      .then((res) => res.data, handleError);
  }

  /**
   * Create Upload Audience Group
   *
   * Adds new user IDs or IFAs to an audience for uploading user IDs.
   *
   * 【Request timeout values】
   *
   * We strongly recommend using request timeout values of 30 seconds or more.
   *
   * 【You can't switch between user IDs and IFAs】
   *
   * Add the same type of data (user IDs or IFAs) to an audience for uploading user IDs as you originally specified when creating that audience. For example, you can't add user IDs to an audience that originally used IFAs when it was created.
   *
   * You can use an audience's `isIfaAudience` property to determine which type of recipient (user IDs or IFAs) was specified when the audience was created. For more details, see [Get audience data](https://developers.line.biz/en/reference/messaging-api/#get-audience-group).
   *
   * 【You can't delete user IDs or IFAs】
   *
   * You cannot delete a user ID or IFA after adding it.
   *
   * [Official document - update upload audience group](https://developers.line.biz/en/reference/messaging-api/#update-upload-audience-group)
   *
   * @param audienceGroupId - The audience ID.
   * @param audiences - An array of up to 10,000 user IDs or IFAs.
   * @param options - Update upload audience group options.
   * @returns Returns the HTTP `202` status code.
   */
  updateUploadAudienceGroup(
    audienceGroupId: number,
    audiences: LineTypes.Audience[],
    options: LineTypes.UpdateUploadAudienceGroupOptions = {}
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.axios
      .put('/v2/bot/audienceGroup/upload', {
        audienceGroupId,
        audiences,
        ...options,
      })
      .then((res) => res.data, handleError);
  }

  /**
   * Create Click Audience Group
   *
   * Creates an audience for click-based retargeting. You can create up to 1,000 audiences.
   *
   * A click-based retargeting audience is a collection of users who have clicked a URL contained in a broadcast or narrowcast message.
   *
   * Use a request ID to identify the message. The message is sent to any user who has clicked at least one link.
   *
   * [Official document - create click audience group](https://developers.line.biz/en/reference/messaging-api/#create-click-audience-group)
   *
   * @param description - The audience's name. Audience names must be unique. This is case-insensitive, meaning `AUDIENCE` and `audience` are considered identical.
   * - Max character limit: 120
   * @param requestId - The request ID of a broadcast or narrowcast message sent in the past 60 days. Each Messaging API request has a request ID.
   * @param options - create click audience group options
   * @returns Returns a [[ClickAudienceGroup]] along with the `202` HTTP status code.
   */
  createClickAudienceGroup(
    description: string,
    requestId: string,
    options: LineTypes.CreateClickAudienceGroupOptions = {}
  ): Promise<LineTypes.ClickAudienceGroup> {
    return this.axios
      .post('/v2/bot/audienceGroup/click', {
        description,
        requestId,
        ...options,
      })
      .then((res) => res.data, handleError);
  }

  /**
   * Create Impression-based Audience Group
   *
   * Creates an audience for impression-based retargeting. You can create up to 1,000 audiences.
   *
   * An impression-based retargeting audience is a collection of users who have viewed a broadcast or narrowcast message.
   *
   * Use a request ID to specify the message. The audience will include any user who has viewed at least one message bubble.
   *
   * [Official document - create imp audience group](https://developers.line.biz/en/reference/messaging-api/#create-imp-audience-group)
   *
   * @param description - The audience's name. Audience names must be unique. This is case-insensitive, meaning `AUDIENCE` and `audience` are considered identical.
   * - Max character limit: 120
   * @param requestId - The request ID of a broadcast or narrowcast message sent in the past 60 days. Each Messaging API request has a request ID.
   * @returns Returns an [[ImpAudienceGroup]] along with the `202` HTTP status code.
   */
  createImpAudienceGroup(
    description: string,
    requestId: string
  ): Promise<LineTypes.ImpAudienceGroup> {
    return this.axios
      .post('/v2/bot/audienceGroup/imp', {
        description,
        requestId,
      })
      .then((res) => res.data, handleError);
  }

  /**
   * Set Description of Audience Group
   *
   * Renames an existing audience.
   *
   * [Official document - set description audience group](https://developers.line.biz/en/reference/messaging-api/#set-description-audience-group)
   *
   * @param description - The audience's name. Audience names must be unique. This is case-insensitive, meaning `AUDIENCE` and `audience` are considered identical.
   * - Max character limit: 120
   * @param audienceGroupId - The audience ID.
   * @returns Returns the `200` HTTP status code.
   */
  setDescriptionAudienceGroup(
    description: string,
    audienceGroupId: number
  ): Promise<void> {
    return this.axios
      .put(`/v2/bot/audienceGroup/${audienceGroupId}/updateDescription`, {
        description,
      })
      .then((res) => res.data, handleError);
  }

  /**
   * Deletes Audience Group
   *
   * Deletes an audience.
   *
   * You can't undo deleting an audience
   *
   * Make sure that an audience is no longer in use before you delete it.
   *
   * [Official document - delete audience group](https://developers.line.biz/en/reference/messaging-api/#delete-audience-group)
   *
   * @param audienceGroupId - The audience ID.
   * @returns Returns the `200` HTTP status code.
   */
  deleteAudienceGroup(
    audienceGroupId: number
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.axios
      .delete(`/v2/bot/audienceGroup/${audienceGroupId}`)
      .then((res) => res.data, handleError);
  }

  /**
   * Get Audience Group
   *
   * Gets audience data.
   *
   * [Official document - get audience group](https://developers.line.biz/en/reference/messaging-api/#get-audience-group)
   *
   * @param audienceGroupId - The audience ID.
   * @returns Returns a `200` HTTP status code and an [[AudienceGroupWithJob]].
   */
  getAudienceGroup(
    audienceGroupId: number
  ): Promise<LineTypes.AudienceGroupWithJob> {
    return this.axios
      .get(`/v2/bot/audienceGroup/${audienceGroupId}`)
      .then((res) => res.data, handleError);
  }

  /**
   * Get Audience Groups
   *
   * Gets data for more than one audience.
   *
   * [Official document - get audience groups](https://developers.line.biz/en/reference/messaging-api/#get-audience-groups)
   *
   * @param options - get audience groups options
   * @returns Returns a `200` HTTP status code and an [[AudienceGroups]].
   */
  getAudienceGroups(
    options: LineTypes.GetAudienceGroupsOptions = {}
  ): Promise<LineTypes.AudienceGroups> {
    const query = querystring.stringify({
      page: 1,
      ...options,
    });
    return this.axios
      .get(`/v2/bot/audienceGroup/list?${query}`)
      .then((res) => res.data, handleError);
  }

  /**
   * Get Audience Group Authority Level
   *
   * Get the authority level of the audience
   *
   * [Official document - get authority level](https://developers.line.biz/en/reference/messaging-api/#get-authority-level)
   *
   * @returns Returns status code `200` and an [[AudienceGroupAuthorityLevel]].
   */
  getAudienceGroupAuthorityLevel(): Promise<
    LineTypes.AudienceGroupAuthorityLevel
  > {
    return this.axios
      .get(`/v2/bot/audienceGroup/authorityLevel`)
      .then((res) => res.data, handleError);
  }

  /**
   * Change the authority level of all audiences created in the same channel.
   *
   * - Audiences set to `PUBLIC` will be available in channels other than the one where you created the audience. For example, it will be available in [LINE Official Account Manager](https://manager.line.biz/), [LINE Ad Manager](https://admanager.line.biz/), and all channels the bot is linked to.
   * - Audiences set to `PRIVATE` will be available only in the channel where you created the audience.
   *
   * [Official document - change authority level](https://developers.line.biz/en/reference/messaging-api/#change-authority-level)
   *
   * @param authorityLevel - The authority level for all audiences linked to a channel
   * - `PUBLIC`: The default authority level. Audiences will be available in channels other than the one where you created the audience. For example, it will be available in [LINE Official Account Manager](https://manager.line.biz/), [LINE Ad Manager](https://admanager.line.biz/), and all channels the bot is linked to.
   * - `PRIVATE`: Audiences will be available only in the channel where you created the audience.
   * @returns Returns the HTTP `200` status code.
   */
  changeAudienceGroupAuthorityLevel(
    authorityLevel: 'PUBLIC' | 'PRIVATE'
  ): Promise<LineTypes.MutationSuccessResponse> {
    return this.axios
      .put(`/v2/bot/audienceGroup/authorityLevel`, {
        authorityLevel,
      })
      .then((res) => res.data, handleError);
  }
}
