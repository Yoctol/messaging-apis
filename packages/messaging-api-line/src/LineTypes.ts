import { OnRequestFunction } from 'messaging-api-common';

export type ClientConfig = {
  accessToken: string;
  channelSecret?: string;
  origin?: string;
  dataOrigin?: string;
  onRequest?: OnRequestFunction;
};

/**
 * User Profile
 *
 */
export type User = {
  /** User's display name */
  displayName: string;

  /** User ID */
  userId: string;

  language?: string;

  /** Profile image URL. "https" image URL. Not included in the response if the user doesn't have a profile image. */
  pictureUrl: string;

  /** User's status message. Not included in the response if the user doesn't have a status message. */
  statusMessage: string;
};

/**
 * Group Summary
 */
export type Group = {
  /** Group ID */
  groupId: string;

  /** Group Name */
  groupName: string;

  /** Group icon URL */
  pictureUrl: string;
};

export type ImageMessage = {
  type: 'image';

  /**
   * Image URL (Max character limit: 1000)
   * - HTTPS over TLS 1.2 or later
   * - JPEG
   * - Max: 4096 x 4096
   * - Max: 1 MB
   */
  originalContentUrl: string;

  /**
   * Preview image URL (Max character limit: 1000)
   * - HTTPS over TLS 1.2 or later
   * - JPEG
   * - Max: 240 x 240
   * - Max: 1 MB
   */
  previewImageUrl: string;
};

/**
 * Defines the size of a tappable area. The top left is used as the origin of the area. Set these properties based on the `baseSize.width` property and the `baseSize.height` property.
 */
export type ImageMapArea = {
  /** Horizontal position relative to the left edge of the area. Value must be 0 or higher. */
  x: number;

  /** Vertical position relative to the top of the area. Value must be 0 or higher. */
  y: number;

  /** Width of the tappable area */
  width: number;

  /** Height of the tappable area */
  height: number;
};

export type ImageMapUriAction = {
  type: 'uri';

  /**
   * Label for the action. Spoken when the accessibility feature is enabled on the client device.
   * - Max character limit: 50
   * - Supported on LINE 8.2.0 and later for iOS.
   */
  label?: string;

  /**
   * - Webpage URL
   * - Max character limit: 1000
   *
   * The available schemes are http, https, line, and tel. For more information about the LINE URL scheme, see Using the LINE URL scheme.
   */
  linkUri: string;

  /**
   * Defined tappable area
   */
  area: ImageMapArea;
};

export type ImageMapMessageAction = {
  type: 'message';

  /**
   * Label for the action. Spoken when the accessibility feature is enabled on the client device.
   * - Max character limit: 50
   * - Supported on LINE 8.2.0 and later for iOS.
   */
  label?: string;

  /**
   * Message to send
   * - Max character limit: 400
   * - Supported on LINE for iOS and Android only.
   */
  text: string;

  /**
   * Defined tappable area
   */
  area: ImageMapArea;
};

/**
 * Imagemap message
 *
 * Imagemap messages are messages configured with an image that has multiple tappable areas. You can assign one tappable area for the entire image or different tappable areas on divided areas of the image.
 *
 * You can also play a video on the image and display a label with a hyperlink after the video is finished.
 *
 * [Official document - imagemap message](https://developers.line.biz/en/reference/messaging-api/#imagemap-message)
 */
export type ImagemapMessage = {
  type: 'imagemap';

  /**
   * Base URL of the image
   * - Max character limit: 1000
   * - `HTTPS` over `TLS` 1.2 or later
   * - For more information about supported images in imagemap messages, see [How to configure an image](https://developers.line.biz/en/reference/messaging-api/#base-url).
   */
  baseUrl: string;

  /**
   * Alternative text
   * - Max character limit: 400
   */
  altText: string;

  baseSize: {
    /**
     * Height of base image. Set to the height that corresponds to a width of 1040 pixels.
     */
    height: number;

    /**
     * Width of base image in pixels. Set to 1040.
     */
    width: number;
  };

  video?: ImageMapVideo;

  /**
   * Imagemap action objects
   *
   * Object which specifies the actions and tappable areas of an imagemap.
   *
   * When an area is tapped, the user is redirected to the URI specified in `uri` and the message specified in `message` is sent.
   *
   * - Action when tapped
   * - Max: 50
   */
  actions: (ImageMapUriAction | ImageMapMessageAction)[];
};

export type VideoMessage = {
  type: 'video';

  /**
   * URL of video file
   * - Max character limit: 1000
   * - HTTPS over TLS 1.2 or later
   * - mp4
   * - Max: 1 minute
   * - Max: 10 MB
   *
   * A very wide or tall video may be cropped when played in some environments.
   */
  originalContentUrl: string;

  /**
   * URL of preview image
   * - Max character limit: 1000
   * - HTTPS over TLS 1.2 or later
   * - JPEG
   * - Max: 240 x 240
   * - Max: 1 MB
   */
  previewImageUrl: string;
};

export type AudioMessage = {
  type: 'audio';

  /**
   * URL of audio file
   * - Max character limit: 1000
   * - HTTPS over TLS 1.2 or later
   * - m4a
   * - Max: 1 minute
   * - Max: 10 MB
   */
  originalContentUrl: string;

  /**
   * Length of audio file (milliseconds)
   */
  duration: number;
};

export type Location = {
  /**
   * Title
   * - Max character limit: 100
   */
  title: string;

  /**
   * Address
   * - Max character limit: 100
   */
  address: string;

  /** Latitude */
  latitude: number;

  /** Longitude */
  longitude: number;
};

export type LocationMessage = {
  type: 'location';

  /**
   * Title
   * - Max character limit: 100
   */
  title: string;

  /**
   * Address
   * - Max character limit: 100
   */
  address: string;

  /** Latitude */
  latitude: number;

  /** Longitude */
  longitude: number;
};

export type StickerMessage = {
  type: 'sticker';

  /**
   * Package ID for a set of stickers. For information on package IDs, see the [Sticker list](https://developers.line.biz/media/messaging-api/sticker_list.pdf).
   */
  packageId: string;

  /**
   * Sticker ID. For a list of sticker IDs for stickers that can be sent with the Messaging API, see the [Sticker list](https://developers.line.biz/media/messaging-api/sticker_list.pdf).
   */
  stickerId: string;
};

/**
 * When a control associated with this action is tapped, a [postback event](https://developers.line.biz/en/reference/messaging-api/#postback-event) is returned via webhook with the specified string in the data property.
 */
export type PostbackAction = {
  type: 'postback';

  /**
   * Label for the action
   * - Required for templates other than image carousel. Max character limit: 20
   * - Optional for image carousel templates. Max character limit: 12
   * - Optional for rich menus. Spoken when the accessibility feature is enabled on the client device. Max character limit: 20. Supported on LINE 8.2.0 and later for iOS.
   * - Required for quick reply buttons. Max character limit: 20. Supported on LINE 8.11.0 and later for iOS and Android.
   * - Required for the button of Flex Message. This property can be specified for the box, image, and text but its value is not displayed. Max character limit: 20
   */
  label?: string;

  /**
   * String returned via webhook in the postback.data property of the postback event
   * - Max character limit: 300
   */
  data: string;

  /**
   * 【Deprecated】 Text displayed in the chat as a message sent by the user when the action is performed. Returned from the server through a webhook. This property shouldn't be used with quick reply buttons.
   * - Max character limit: 300
   * - The displayText and text properties cannot both be used at the same time.
   */
  text?: string;

  /**
   * Text displayed in the chat as a message sent by the user when the action is performed. Required for quick reply buttons. Optional for the other message types.
   * - Max character limit: 300
   * - The displayText and text properties cannot both be used at the same time.
   */
  displayText?: string;
};

/**
 * When a control associated with this action is tapped, the string in the `text` property is sent as a message from the user.
 */
export type MessageAction = {
  type: 'message';

  /**
   * Label for the action
   * - Required for templates other than image carousel. Max character limit: 20
   * - Optional for image carousel templates. Max character limit: 12
   * - Optional for rich menus. Spoken when the accessibility feature is enabled on the client device. Max character limit: 20. Supported on LINE 8.2.0 and later for iOS.
   * - Required for quick reply buttons. Max character limit: 20. Supported on LINE 8.11.0 and later for iOS and Android.
   * - Required for the button of Flex Message. This property can be specified for the box, image, and text but its value is not displayed. Max charater limit: 20
   */
  label?: string;

  /**
   * Text sent when the action is performed
   * - Max character limit: 300
   */
  text: string;
};

/**
 * When a control associated with this action is tapped, the URI specified in the `uri` property is opened.
 */
export type URIAction = {
  type: 'uri';

  /**
   * Label for the action
   * - Required for templates other than image carousel. Max character limit: 20
   * - Optional for image carousel templates. Max character limit: 12
   * - Optional for rich menus. Spoken when the accessibility feature is enabled on the client device. Max character limit: 20. Supported on LINE 8.2.0 and later for iOS.
   * - Required for the button of Flex Message. This property can be specified for the box, image, and text but its value is not displayed. Max character limit: 20
   */
  label?: string;

  /**
   * URI opened when the action is performed (Max character limit: 1000)
   *
   * The available schemes are `http`, `https`, `line`, and `tel`. For more information about the LINE URL scheme, see Using the LINE URL scheme.
   */
  uri: string;
};

/**
 * When a control associated with this action is tapped, a [postback event](https://developers.line.biz/en/reference/messaging-api/#postback-event) is returned via webhook with the date and time selected by the user from the date and time selection dialog. The datetime picker action does not support time zones.
 */
export type DatetimePickerAction = {
  type: 'datetimepicker';
  /**
   * Label for the action
   * - Required for templates other than image carousel. Max character limit: 20
   * - Optional for image carousel templates. Max character limit: 12
   * - Optional for rich menus. Spoken when the accessibility feature is enabled on the client device. Max character limit: 20. Supported on LINE 8.2.0 and later for iOS.
   * - Required for quick reply buttons. Max character limit: 20. Supported on LINE 8.11.0 and later for iOS and Android.
   * - Required for the button of Flex Message. This property can be specified for the box, image, and text but its value is not displayed. Max character limit: 20
   */
  label?: string;
  /**
   * String returned via webhook in the `postback.data` property of the [postback event](https://developers.line.biz/en/reference/messaging-api/#postback-event)
   * - Max character limit: 300
   */
  data: 'string';
  /**
   * Action mode
   * - date: Pick date
   * - time: Pick time
   * - datetime: Pick date and time
   */
  mode: 'date' | 'time' | 'datetime';
  /**
   * Initial value of date or time.
   *
   * [Date and time format](https://developers.line.biz/en/reference/messaging-api/#date-and-time-format)
   */
  initial?: string;

  /**
   * Largest date or time value that can be selected. Must be greater than the `min` value.
   *
   * [Date and time format](https://developers.line.biz/en/reference/messaging-api/#date-and-time-format)
   */
  max?: string;

  /**
   * Smallest date or time value that can be selected. Must be less than the `max` value.
   *
   * [Date and time format](https://developers.line.biz/en/reference/messaging-api/#date-and-time-format)
   */
  min?: string;
};

/**
 * This action can be configured only with quick reply buttons. When a button associated with this action is tapped, the camera screen in LINE is opened.
 */
export type CameraAction = {
  type: 'camera';

  /**
   * Label for the action
   * - Max character limit: 20
   */
  label: string;
};

/**
 * This action can be configured only with quick reply buttons. When a button associated with this action is tapped, the camera roll screen in LINE is opened.
 */
export type CameraRollAction = {
  type: 'cameraRoll';
  /**
   * Label for the action
   * - Max character limit: 20
   */
  label: string;
};

/**
 * This action can be configured only with quick reply buttons. When a button associated with this action is tapped, the location screen in LINE is opened.
 */
export type LocationAction = {
  type: 'location';

  /**
   * Label for the action
   * - Max character limit: 20
   */
  label: string;
};

export type Action =
  | PostbackAction
  | MessageAction
  | URIAction
  | DatetimePickerAction
  | CameraAction
  | CameraRollAction
  | LocationAction;

export type QuickReplyAction =
  | PostbackAction
  | MessageAction
  | DatetimePickerAction
  | CameraAction
  | CameraRollAction
  | LocationAction;

/**
 * This is a container that contains quick reply buttons.
 *
 * If a version of LINE that doesn't support the quick reply feature receives a message that contains quick reply buttons, only the message is displayed.
 */
export type QuickReply = {
  /**
   * This is a quick reply option that is displayed as a button.
   *
   * - Max: 13 objects
   */
  items: {
    type: 'action';

    /**
     * URL of the icon that is displayed at the beginning of the button
     * - Max character limit: 1000
     * - URL scheme: https
     * - Image format: PNG
     * - Aspect ratio: 1:1
     * - Data size: Up to 1 MB
     *
     * There is no limit on the image size.
     *
     * If the action property has a camera action, camera roll action, or location action, and the imageUrl property is not set, the default icon is displayed.
     */
    imageUrl?: string;

    /**
     * Action performed when this button is tapped. Specify an action object. The following is a list of the available actions:
     * - Postback action
     * - Message action
     * - Datetime picker action
     * - Camera action
     * - Camera roll action
     * - Location action
     */
    action: QuickReplyAction;
  }[];
};

/**
 * When sending a message from the LINE Official Account, you can specify the `sender.name` and the `sender.iconUrl` properties in Message objects.
 */
export type Sender = {
  /**
   * Display name. Certain words such as LINE may not be used.
   *
   * - Max character limit: 20
   */
  name?: string;

  /**
   * URL of the image to display as an icon when sending a message
   *
   * - Max character limit: 1000
   * - URL scheme: https
   */
  iconUrl?: string;
};

/**
 * Common properties for messages
 *
 * The following properties can be specified in all the message objects.
 * - Quick reply
 * - sender
 */
export type MessageOptions = {
  /**
   * These properties are used for the quick reply feature. Supported on LINE 8.11.0 and later for iOS and Android. For more information, see [Using quick replies](https://developers.line.biz/en/docs/messaging-api/using-quick-reply/).
   */
  quickReply?: QuickReply;

  sender?: Sender;
};

/**
 * Template messages are messages with predefined layouts which you can customize. For more information, see Template messages.
 *
 * The following template types are available:
 *
 * - Buttons
 * - Confirm
 * - Carousel
 * - Image carousel
 */
export type TemplateMessage<Template> = {
  type: 'template';

  /**
   * Alternative text
   * - Max character limit: 400
   */
  altText: string;

  /**
   * A Buttons, Confirm, Carousel, or Image Carousel object.
   */
  template: Template;
};

/**
 * Buttons template
 *
 * Template with an image, title, text, and multiple action buttons.
 *
 * Because of the height limitation for buttons template messages, the lower part of the text display area will get cut off if the height limitation is exceeded. For this reason, depending on the character width, the message text may not be fully displayed even when it is within the character limits.
 */
export type ButtonsTemplate = {
  type: 'buttons';

  /**
   * Image URL
   * - Max character limit: 1,000
   * - HTTPS over TLS 1.2 or later
   * - JPEG or PNG
   * - Max width: 1024px
   * - Max file size: 1 MB
   */
  thumbnailImageUrl?: string;

  /**
   * Aspect ratio of the image. One of:
   * - `rectangle`: 1.51:1
   * - `square`: 1:1
   *
   * Default: `rectangle`
   */
  imageAspectRatio?: 'rectangle' | 'square';

  /**
   * Size of the image. One of:
   * - `cover`: The image fills the entire image area. Parts of the image that do not fit in the area are not displayed.
   * - `contain`: The entire image is displayed in the image area. A background is displayed in the unused areas to the left and right of vertical images and in the areas above and below horizontal images.
   *
   * Default: `cover`
   */
  imageSize?: 'cover' | 'contain';

  /**
   * Background color of the image. Specify a RGB color value. Default: `#FFFFFF` (white)
   */
  imageBackgroundColor?: string;

  /**
   * Title
   * - Max character limit: 40
   */
  title?: string;

  /**
   * Message text
   * - Max character limit: 160 (no image or title)
   * - Max character limit: 60 (message with an image or title)
   */
  text: string;

  /**
   * Action when image, title or text area is tapped.
   */
  defaultAction?: Action;

  /**
   * Action when tapped
   * - Max objects: 4
   */
  actions: Action[];
};

/**
 * Confirm template
 *
 * Template with two action buttons.
 *
 * Because of the height limitation for confirm template messages, the lower part of the text display area will get cut off if the height limitation is exceeded. For this reason, depending on the character width, the message text may not be fully displayed even when it is within the character limits.
 */
export type ConfirmTemplate = {
  type: 'confirm';

  /**
   * Message text
   * - Max character limit: 240
   */
  text: string;

  /**
   * Array of action objects
   * - Action when tapped
   * - Set 2 actions for the 2 buttons
   */
  actions: Action[];
};

export type ColumnObject = {
  /**
   * Image URL
   * - Max character limit: 1,000
   * - HTTPS over TLS 1.2 or later
   * - JPEG or PNG
   * - Aspect ratio: 1:1.51
   * - Max width: 1024px
   * - Max file size: 1 MB
   */
  thumbnailImageUrl?: string;

  /**
   * Background color of the image. Specify a RGB color value. The default value is `#FFFFFF` (white).
   */
  imageBackgroundColor?: string;

  /**
   * Title
   * - Max character limit: 40
   */
  title?: string;

  /**
   * Message text
   * - Max character limit: 120 (no image or title)
   * - Max character limit: 60 (message with an image or title)
   */
  text: string;

  /**
   * Action when image, title or text area is tapped.
   */
  defaultAction?: Action;

  /**
   * Action when tapped
   * - Max objects: 3
   */
  actions: Action[];
};

/**
 * Carousel template
 *
 * Template with multiple columns which can be cycled like a carousel. The columns are shown in order when scrolling horizontally.
 *
 * Because of the height limitation for carousel template messages, the lower part of the text display area will get cut off if the height limitation is exceeded. For this reason, depending on the character width, the message text may not be fully displayed even when it is within the character limits.
 *
 * Keep the number of actions consistent for all columns. If you use an image or title for a column, make sure to do the same for all other columns.
 */
export type CarouselTemplate = {
  type: 'carousel';

  /**
   * Array of columns
   * - Max columns: 10
   */
  columns: ColumnObject[];

  /**
   * Aspect ratio of the image. One of:
   * - `rectangle`: 1.51:1
   * - `square`: 1:1
   *
   * Applies to all columns. Default: `rectangle`
   */
  imageAspectRatio?: 'rectangle' | 'square';

  /**
   * Size of the image. One of:
   * - cover: The image fills the entire image area. Parts of the image that do not fit in the area are not displayed.
   * - contain: The entire image is displayed in the image area. A background is displayed in the unused areas to the left and right of vertical images and in the areas above and below horizontal images.
   *
   * Applies to all columns. Default: cover.
   */
  imageSize?: 'cover' | 'contain';
};

export type ImageCarouselColumnObject = {
  /**
   * Image URL
   * - Max character limit: 1,000
   * - HTTPS over TLS 1.2 or later
   * - JPEG or PNG
   * - Aspect ratio: 1:1
   * - Max width: 1024px
   * - Max file size: 1 MB
   */
  imageUrl: string;

  /** Action when image is tapped */
  action: Action;
};

/**
 * Image carousel template
 *
 * Template with multiple images which can be cycled like a carousel. The images are shown in order when scrolling horizontally.
 */
export type ImageCarouselTemplate = {
  type: 'image_carousel';

  /**
   * Array of columns
   * - Max columns: 10
   */
  columns: ImageCarouselColumnObject[];
};

export type CarouselTemplateOptions = MessageOptions & {
  /**
   * Aspect ratio of the image. One of:
   * - `rectangle`: 1.51:1
   * - `square`: 1:1
   *
   * Applies to all columns. Default: `rectangle`
   */
  imageAspectRatio?: 'rectangle' | 'square';

  /**
   * Size of the image. One of:
   * - `cover`: The image fills the entire image area. Parts of the image that do not fit in the area are not displayed.
   * - `contain`: The entire image is displayed in the image area. A background is displayed in the unused areas to the left and right of vertical images and in the areas above and below horizontal images.
   *
   * Applies to all columns. Default: `cover`.
   */
  imageSize?: 'cover' | 'contain';
};

export type Template =
  | ButtonsTemplate
  | ConfirmTemplate
  | CarouselTemplate
  | ImageCarouselTemplate;

/**
 * A container is the top-level structure of a Flex Message. Here are the types of containers available.
 *
 * - [Bubble](https://developers.line.biz/en/reference/messaging-api/#bubble)
 * - [Carousel](https://developers.line.biz/en/reference/messaging-api/#f-carousel)
 *
 * See [Flex Message elements](https://developers.line.biz/en/docs/messaging-api/flex-message-elements/)
 * for the containers' JSON data samples and usage.
 */
export type FlexContainer = FlexBubble | FlexCarousel;

/**
 * This is a container that contains one message bubble. It can contain four
 * blocks: header, hero, body, and footer.
 *
 * The maximum size of JSON data that defines a bubble is 10 KB.
 *
 * For more information about using each block, see
 * [Block](https://developers.line.biz/en/docs/messaging-api/flex-message-elements/#block).
 */
export type FlexBubble = {
  type: 'bubble';

  /**
   * The size of the bubble. You can specify one of the following values: nano, micro, kilo, mega, or giga. The default value is mega.
   */
  size?: 'nano' | 'micro' | 'kilo' | 'mega' | 'giga';
  /**
   * Text directionality and the order of components in horizontal boxes in the
   * container. Specify one of the following values:
   *
   * - `ltr`: Left to right
   * - `rtl`: Right to left
   *
   * The default value is `ltr`.
   */
  direction?: 'ltr' | 'rtl';

  /**
   * Header block. Specify a Box.
   */
  header?: FlexBox<FlexBoxLayout>;

  /**
   * Hero block. Specify a box or an image.
   */
  hero?: FlexBox<FlexBoxLayout> | FlexImage;

  /**
   * Body block. Specify a Box.
   */
  body?: FlexBox<FlexBoxLayout>;

  /**
   * Footer block. Specify a Box.
   */
  footer?: FlexBox<FlexBoxLayout>;

  /**
   * Style of each block. Specify a bubble style.
   */
  styles?: FlexBubbleStyle;

  /**
   * Action performed when this image is tapped. Specify an action object. This property is supported on the following versions of LINE.
   *
   * LINE for iOS and Android: 8.11.0 and later
   */
  action?: Action;
};

export type FlexBubbleStyle = {
  header?: FlexBlockStyle;
  hero?: FlexBlockStyle;
  body?: FlexBlockStyle;
  footer?: FlexBlockStyle;
};

/**
 * Objects for the block style
 */
export type FlexBlockStyle = {
  /**
   * Background color of the block. Use a hexadecimal color code.
   */
  backgroundColor?: string;
  /**
   * - `true` to place a separator above the block.
   * - `true` will be ignored for the first block in a container because you
   *   cannot place a separator above the first block.
   * - The default value is `false`.
   */
  separator?: boolean;
  /**
   * Color of the separator. Use a hexadecimal color code.
   */
  separatorColor?: string;
};

/**
 * Carousel
 *
 * A carousel is a container that contains multiple bubbles as child elements. Users can scroll horizontally through the bubbles.
 *
 * The maximum size of JSON data that defines a carousel is 50 KB.
 *
 * 【Bubble width】
 *
 * A carousel cannot contain bubbles of different widths (size property). Each bubble in a carousel should have the same width.
 *
 * 【Bubble height】
 *
 * The body of each bubble will stretch to match the bubble with the greatest height in the carousel. However, bubbles with no body will not change height.
 */
export type FlexCarousel = {
  type: 'carousel';

  /**
   * Bubbles in the carousel.
   * - Max: 10 bubbles
   */
  contents: FlexBubble[];
};

/**
 * Components are objects that compose a Flex Message container. Here are the
 * types of components available:
 *
 * - [Box](https://developers.line.biz/en/reference/messaging-api/#box)
 * - [Button](https://developers.line.biz/en/reference/messaging-api/#button)
 * - [Image](https://developers.line.biz/en/reference/messaging-api/#f-image)
 * - [Icon](https://developers.line.biz/en/reference/messaging-api/#icon)
 * - [Text](https://developers.line.biz/en/reference/messaging-api/#f-text)
 * - [Span](https://developers.line.biz/en/reference/messaging-api/#span)
 * - [Separator](https://developers.line.biz/en/reference/messaging-api/#separator)
 * - [Filler](https://developers.line.biz/en/reference/messaging-api/#filler)
 * - [Spacer (not recommended)](https://developers.line.biz/en/reference/messaging-api/#spacer)
 *
 * See the followings for the components' JSON data samples and usage.
 *
 * - [Flex Message elements](https://developers.line.biz/en/docs/messaging-api/flex-message-elements/)
 * - [Flex Message layout](https://developers.line.biz/en/docs/messaging-api/flex-message-layout/)
 */
export type FlexComponent =
  | FlexBox<FlexBoxLayout>
  | FlexButton
  | FlexImage
  | FlexIcon
  | FlexText
  | FlexSpan
  | FlexSeparator
  | FlexFiller
  | FlexSpacer;

export type FlexBoxLayout = 'horizontal' | 'vertical' | 'baseline';

/**
 * This is a component that defines the layout of child components.
 * You can also include a box in a box.
 */
export type FlexBox<L extends FlexBoxLayout> = {
  type: 'box';
  /**
   * The placement style of components in this box. Specify one of the following values:
   *
   * - `horizontal`: Components are placed horizontally. The `direction`
   *     property of the [bubble](https://developers.line.biz/en/reference/messaging-api/#bubble)
   *     container specifies the order.
   * - `vertical`: Components are placed vertically from top to bottom.
   * - `baseline`: Components are placed in the same way as `horizontal` is
   *     specified except the baselines of the components are aligned.
   *
   * For more information, see
   * [Types of box layouts](https://developers.line.biz/en/docs/messaging-api/flex-message-layout/#box-layout-types).
   */
  layout: L;
  /**
   * Components in this box. Here are the types of components available:
   *
   * - When the `layout` property is `horizontal` or `vertical`:
   *   + [Box](https://developers.line.biz/en/reference/messaging-api/#box)
   *   + [button](https://developers.line.biz/en/reference/messaging-api/#button)
   *   + [image](https://developers.line.biz/en/reference/messaging-api/#f-image)
   *   + [text](https://developers.line.biz/en/reference/messaging-api/#f-text)
   *   + [separator](https://developers.line.biz/en/reference/messaging-api/#separator)
   *   + [filler](https://developers.line.biz/en/reference/messaging-api/#filler)
   *   + [spacer (not recommended)](https://developers.line.biz/en/reference/messaging-api/#spacer)
   * - When the `layout` property is `baseline`:
   *   + [icon](https://developers.line.biz/en/reference/messaging-api/#icon)
   *   + [text](https://developers.line.biz/en/reference/messaging-api/#f-text)
   *   + [filler](https://developers.line.biz/en/reference/messaging-api/#filler)
   *   + [spacer (not recommended)](https://developers.line.biz/en/reference/messaging-api/#spacer)
   */
  contents: L extends 'baseline'
    ? (FlexIcon | FlexText | FlexFiller | FlexSpacer)[]
    : (
        | FlexBox<FlexBoxLayout>
        | FlexButton
        | FlexImage
        | FlexText
        | FlexSeparator
        | FlexFiller
        | FlexSpacer
      )[];
  /**
   * Background color of the block. In addition to the RGB color, an alpha
   * channel (transparency) can also be set. Use a hexadecimal color code.
   * (Example:#RRGGBBAA) The default value is `#00000000`.
   */
  backgroundColor?: string;
  /**
   * Color of box border. Use a hexadecimal color code.
   */
  borderColor?: string;
  /**
   * Width of box border. You can specify a value in pixels or any one of none,
   * light, normal, medium, semi-bold, or bold. none does not render a border
   * while the others become wider in the order of listing.
   */
  borderWidth?:
    | string
    | 'none'
    | 'light'
    | 'normal'
    | 'medium'
    | 'semi-bold'
    | 'bold';
  /**
   * Radius at the time of rounding the corners of the border. You can specify a
   * value in pixels or any one of `none`, `xs`, `sm`, `md`, `lg`, `xl`, or `xxl`. none does not
   * round the corner while the others increase in radius in the order of listing. The default value is none.
   */
  cornerRadius?: string | 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  /**
   * Width of the box. For more information, see [Width of a box](https://developers.line.biz/en/docs/messaging-api/flex-message-layout/#box-width) in the API documentation.
   */
  width?: string;
  /**
   * Height of the box. For more information, see [Height of a box](https://developers.line.biz/en/docs/messaging-api/flex-message-layout/#box-height) in the API documentation.
   */
  height?: string;
  /**
   * The ratio of the width or height of this box within the parent box. The
   * default value for the horizontal parent box is `1`, and the default value
   * for the vertical parent box is `0`.
   *
   * For more information, see
   * [Width and height of components](https://developers.line.biz/en/docs/messaging-api/flex-message-layout/#component-width-and-height).
   */
  flex?: number;
  /**
   * Minimum space between components in this box.
   *
   * - `none` does not set a space while the other values set a space whose
   *   size increases in the order of listing.
   * - The default value is `none`.
   * - To override this setting for a specific component, set the `margin`
   *   property of that component.
   */
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  /**
   * Minimum space between this box and the previous component in the parent box.
   *
   * - `none` does not set a space while the other values set a space whose
   *   size increases in the order of listing.
   * - The default value is the value of the `spacing` property of the parent
   *   box.
   * - If this box is the first component in the parent box, the `margin`
   *   property will be ignored.
   */
  margin?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  /**
   * Free space between the borders of this box and the child element.
   * For more information, see [Box padding](https://developers.line.biz/en/docs/messaging-api/flex-message-layout/#padding-property) in the API documentation.
   */
  paddingAll?: string;
  /**
   * Free space between the border at the upper end of this box and the upper end of the child element.
   * For more information, see [Box padding](https://developers.line.biz/en/docs/messaging-api/flex-message-layout/#padding-property) in the API documentation.
   */
  paddingTop?: string;
  /**
   * Free space between the border at the lower end of this box and the lower end of the child element.
   * For more information, see [Box padding](https://developers.line.biz/en/docs/messaging-api/flex-message-layout/#padding-property) in the API documentation.
   */
  paddingBottom?: string;
  /**
   * Free space between the border at the left end of this box and the left end of the child element.
   * For more information, see [Box padding](https://developers.line.biz/en/docs/messaging-api/flex-message-layout/#padding-property) in the API documentation.
   */
  paddingStart?: string;
  /**
   * Free space between the border at the right end of this box and the right end of the child element.
   * For more information, see [Box padding](https://developers.line.biz/en/docs/messaging-api/flex-message-layout/#padding-property) in the API documentation.
   */
  paddingEnd?: string;
  /**
   * Action performed when this button is tapped.
   *
   * Specify an [action object](https://developers.line.biz/en/reference/messaging-api/#action-objects).
   */
  action?: Action;
} & Offset;

export type Offset = {
  /**
   * Reference position for placing this box. Specify one of the following values:
   * - `relative`: Use the previous box as reference.
   * - `absolute`: Use the top left of parent element as reference.
   *
   * The default value is relative.
   * For more information, see [Offset](https://developers.line.biz/en/docs/messaging-api/flex-message-layout/#component-offset) in the API documentation.
   */
  position?: 'relative' | 'absolute';
  /**
   * The top offset.
   * For more information, see [Offset](https://developers.line.biz/en/docs/messaging-api/flex-message-layout/#component-offset) in the API documentation.
   */
  offsetTop?: string;
  /**
   * The bottom offset.
   * For more information, see [Offset](https://developers.line.biz/en/docs/messaging-api/flex-message-layout/#component-offset) in the API documentation.
   */
  offsetBottom?: string;
  /**
   * The left offset.
   * For more information, see [Offset](https://developers.line.biz/en/docs/messaging-api/flex-message-layout/#component-offset) in the API documentation.
   */
  offsetStart?: string;
  /**
   * The right offset.
   * For more information, see [Offset](https://developers.line.biz/en/docs/messaging-api/flex-message-layout/#component-offset) in the API documentation.
   */
  offsetEnd?: string;
};

/**
 * This component draws a button.
 *
 * When the user taps a button, a specified action is performed.
 */
export type FlexButton = {
  type: 'button';
  /**
   * Action performed when this button is tapped.
   *
   * Specify an [action object](https://developers.line.biz/en/reference/messaging-api/#action-objects).
   */
  action: Action;
  /**
   * The ratio of the width or height of this box within the parent box.
   *
   * The default value for the horizontal parent box is `1`, and the default
   * value for the vertical parent box is `0`.
   *
   * For more information, see
   * [Width and height of components](https://developers.line.biz/en/docs/messaging-api/flex-message-layout/#component-width-and-height).
   */
  flex?: number;
  /**
   * Minimum space between this box and the previous component in the parent box.
   *
   * - `none` does not set a space while the other values set a space whose
   *   size increases in the order of listing.
   * - The default value is the value of the `spacing` property of the parent
   *   box.
   * - If this box is the first component in the parent box, the `margin`
   *   property will be ignored.
   */
  margin?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  /**
   * Height of the button. The default value is `md`.
   */
  height?: 'sm' | 'md';
  /**
   * Style of the button. Specify one of the following values:
   *
   * - `link`: HTML link style
   * - `primary`: Style for dark color buttons
   * - `secondary`: Style for light color buttons
   *
   * The default value is `link`.
   */
  style?: 'link' | 'primary' | 'secondary';
  /**
   * Use a hexadecimal color code.
   *
   * - Character color when the `style` property is `link`.
   * - Background color when the `style` property is `primary` or `secondary`.
   */
  color?: string;
  /**
   * Vertical alignment style. Specify one of the following values:
   *
   * - `top`: Top-aligned
   * - `bottom`: Bottom-aligned
   * - `center`: Center-aligned
   *
   * The default value is `top`.
   *
   * If the `layout` property of the parent box is `baseline`, the `gravity`
   * property will be ignored.
   */
  gravity?: string;
} & Offset;

/**
 * This is an invisible component to fill extra space between components.
 *
 * - The filler's `flex` property is fixed to 1.
 * - The `spacing` property of the parent box will be ignored for fillers.
 */
export type FlexFiller = {
  type: 'filler';
  /**
   * The ratio of the width or height of this component within the parent box. For more information, see [Width and height of components](https://developers.line.biz/en/docs/messaging-api/flex-message-layout/#component-width-and-height).
   */
  flex?: number;
};

/**
 * This component draws an icon.
 */
export type FlexIcon = {
  type: 'icon';
  /**
   * Image URL
   *
   * Protocol: HTTPS
   * Image format: JPEG or PNG
   * Maximum image size: 240×240 pixels
   * Maximum data size: 1 MB
   */
  url: string;
  /**
   * Minimum space between this box and the previous component in the parent
   * box.
   *
   * - `none` does not set a space while the other values set a space whose
   *   size increases in the order of listing.
   * - The default value is the value of the `spacing` property of the parent
   *   box.
   * - If this box is the first component in the parent box, the `margin`
   *   property will be ignored.
   */
  margin?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  /**
   * Maximum size of the icon width.
   * The size increases in the order of listing.
   * The default value is `md`.
   */
  size?:
    | 'xxs'
    | 'xs'
    | 'sm'
    | 'md'
    | 'lg'
    | 'xl'
    | 'xxl'
    | '3xl'
    | '4xl'
    | '5xl';
  /**
   * Aspect ratio of the icon. `{width}:{height}` format.
   * The values of `{width}` and `{height}` must be in the range 1–100000.
   * `{height}` can't be more than three times the value of `{width}`.
   * The default value is `1:1`.
   */
  aspectRatio?: string;
} & Offset;

/**
 * This component draws an image.
 */
export type FlexImage = {
  type: 'image';
  /**
   * Image URL
   *
   * - Protocol: HTTPS
   * - Image format: JPEG or PNG
   * - Maximum image size: 1024×1024 pixels
   * - Maximum data size: 1 MB
   */
  url: string;
  /**
   * The ratio of the width or height of this box within the parent box.
   *
   * The default value for the horizontal parent box is `1`, and the default
   * value for the vertical parent box is `0`.
   *
   * - For more information, see
   * [Width and height of components](https://developers.line.biz/en/docs/messaging-api/flex-message-layout/#component-width-and-height).
   */
  flex?: number;
  /**
   * Minimum space between this box and the previous component in the parent
   * box.
   *
   * - `none` does not set a space while the other values set a space whose
   *   size increases in the order of listing.
   * - The default value is the value of the `spacing` property of the parent
   *   box.
   * - If this box is the first component in the parent box, the `margin`
   *   property will be ignored.
   */
  margin?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  /**
   * Horizontal alignment style. Specify one of the following values:
   *
   * - `start`: Left-aligned
   * - `end`: Right-aligned
   * - `center`: Center-aligned
   *
   * The default value is `center`.
   */
  align?: 'start' | 'end' | 'center';
  /**
   * Vertical alignment style. Specify one of the following values:
   *
   * - `top`: Top-aligned
   * - `bottom`: Bottom-aligned
   * - `center`: Center-aligned
   *
   * The default value is `top`.
   *
   * If the `layout` property of the parent box is `baseline`, the `gravity` property will be ignored.
   */
  gravity?: 'top' | 'bottom' | 'center';
  /**
   * Maximum size of the image width.
   * The size increases in the order of listing.
   * The default value is `md`.
   */
  size?:
    | 'xxs'
    | 'xs'
    | 'sm'
    | 'md'
    | 'lg'
    | 'xl'
    | 'xxl'
    | '3xl'
    | '4xl'
    | '5xl'
    | 'full';
  /**
   * Aspect ratio of the image. `{width}:{height}` format.
   * Specify the value of `{width}` and `{height}` in the range from 1 to 100000. However,
   * you cannot set `{height}` to a value that is more than three times the value of `{width}`.
   * The default value is `1:1`.
   */
  aspectRatio?: string;
  /**
   * Style of the image. Specify one of the following values:
   *
   * - `cover`: The image fills the entire drawing area. Parts of the image
   *   that do not fit in the drawing area are not displayed.
   * - `fit`: The entire image is displayed in the drawing area. The background
   *   is displayed in the unused areas to the left and right of vertical images
   *   and in the areas above and below horizontal images.
   *
   * The default value is `fit`.
   */
  aspectMode?: 'cover' | 'fit';
  /**
   * Background color of the image. Use a hexadecimal color code.
   */
  backgroundColor?: string;
  /**
   * Action performed when this button is tapped.
   * Specify an [action object](https://developers.line.biz/en/reference/messaging-api/#action-objects).
   */
  action?: Action;
} & Offset;

/**
 * This component draws a separator between components in the parent box.
 */
export type FlexSeparator = {
  type: 'separator';
  /**
   * Minimum space between this box and the previous component in the parent
   * box.
   *
   * - `none` does not set a space while the other values set a space whose
   *   size increases in the order of listing.
   * - The default value is the value of the `spacing` property of the parent
   *   box.
   * - If this box is the first component in the parent box, the `margin`
   *   property will be ignored.
   */
  margin?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  /**
   * Color of the separator. Use a hexadecimal color code.
   */
  color?: string;
};

/**
 * This is an invisible component that places a fixed-size space at the
 * beginning or end of the box.
 */
export type FlexSpacer = {
  type: 'spacer';
  /**
   * Size of the space.
   * The size increases in the order of listing.
   * The default value is `md`.
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
};

export type FlexText = {
  type: 'text';
  text: string;
  /**
   * Array of spans. Be sure to set either one of the `text` property or `contents` property. If you set the `contents` property, `text` is ignored.
   */
  contents?: FlexSpan[];
  /**
   * The ratio of the width or height of this box within the parent box.
   *
   * The default value for the horizontal parent box is `1`, and the default
   * value for the vertical parent box is `0`.
   *
   * For more information, see
   * [Width and height of components](https://developers.line.biz/en/docs/messaging-api/flex-message-layout/#component-width-and-height).
   */
  flex?: number;
  /**
   * Minimum space between this box and the previous component in the parent
   * box.
   *
   * - `none` does not set a space while the other values set a space whose
   *   size increases in the order of listing.
   * - The default value is the value of the `spacing` property of the parent
   *   box.
   * - If this box is the first component in the parent box, the `margin`
   *   property will be ignored.
   */
  margin?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  /**
   * Font size.
   * The size increases in the order of listing.
   * The default value is `md`.
   */
  size?:
    | 'xxs'
    | 'xs'
    | 'sm'
    | 'md'
    | 'lg'
    | 'xl'
    | 'xxl'
    | '3xl'
    | '4xl'
    | '5xl';
  /**
   * Horizontal alignment style. Specify one of the following values:
   *
   * - `start`: Left-aligned
   * - `end`: Right-aligned
   * - `center`: Center-aligned
   *
   * The default value is `start`.
   */
  align?: 'start' | 'end' | 'center';
  /**
   * Vertical alignment style. Specify one of the following values:
   *
   * - `top`: Top-aligned
   * - `bottom`: Bottom-aligned
   * - `center`: Center-aligned
   *
   * The default value is `top`.
   *
   * If the `layout` property of the parent box is `baseline`, the `gravity`
   * property will be ignored.
   */
  gravity?: 'top' | 'bottom' | 'center';
  /**
   * `true` to wrap text.
   *
   * The default value is `false`.
   *
   * If set to `true`, you can use a new line character (`\n`) to begin on a new
   * line.
   */
  wrap?: boolean;
  /**
   * Max number of lines. If the text does not fit in the specified number of
   * lines, an ellipsis (…) is displayed at the end of the last line. If set to
   * 0, all the text is displayed. The default value is 0.
   */
  maxLines?: number;
  /**
   * Font weight.
   * Specifying `bold`makes the font bold.
   * The default value is `regular`.
   */
  weight?: 'regular' | 'bold';
  /**
   * Font color. Use a hexadecimal color code.
   */
  color?: string;
  /**
   * Action performed when this text is tapped.
   * Specify an [action object](https://developers.line.biz/en/reference/messaging-api/#action-objects).
   */
  action?: Action;
  /**
   * Style of the text. Specify one of the following values:
   * - `normal`: Normal
   * - `italic`: Italic
   *
   * The default value is `normal`.
   */
  style?: string;
  /**
   * Decoration of the text. Specify one of the following values:
   * `none`: No decoration
   * `underline`: Underline
   * `line-through`: Strikethrough
   *
   * The default value is `none`.
   */
  decoration?: string;
} & Offset;

/**
 * This component renders multiple text strings with different designs in one row. You can specify the color, size, weight, and decoration for the font. Span is set to `contents` property in [Text](https://developers.line.biz/en/reference/messaging-api/#f-text).
 */
export type FlexSpan = {
  type: 'span';
  /**
   * Text. If the `wrap` property of the parent text is set to `true`, you can use a new line character (`\n`) to begin on a new line.
   */
  text: string;
  /**
   * Font color. Use a hexadecimal color code.
   */
  color?: string;
  /**
   * Font size. You can specify one of the following values: `xxs`, `xs`, `sm`, `md`, `lg`, `xl`, `xxl`, `3xl`, `4xl`, or `5xl`. The size increases in the order of listing. The default value is `md`.
   */
  size?: string;
  /**
   * Font weight. You can specify one of the following values: `regular` or `bold`. Specifying `bold` makes the font bold. The default value is `regular`.
   */
  weight?: string;
  /**
   * Style of the text. Specify one of the following values:
   * - `normal`: Normal
   * - `italic`: Italic
   *
   * The default value is `normal`.
   */
  style?: string;
  /**
   * Decoration of the text. Specify one of the following values:
   * `none`: No decoration
   * `underline`: Underline
   * `line-through`: Strikethrough
   *
   * The default value is `none`.
   *
   * Note: The decoration set in the `decoration` property of the [text](https://developers.line.biz/en/reference/messaging-api/#f-text) cannot be overwritten by the `decoration` property of the span.
   */
  decoration?: string;
};

/**
 * Flex Message
 *
 * Flex Messages are messages with a customizable layout. You can customize the layout freely based on the specification for [CSS Flexible Box (CSS Flexbox)](https://www.w3.org/TR/css-flexbox-1/). For more information, see [Sending Flex Messages](https://developers.line.biz/en/docs/messaging-api/using-flex-messages/) in the API documentation.
 */
export type FlexMessage = {
  type: 'flex';

  /**
   * Alternative text
   * - Max character limit: 400
   */
  altText: string;

  /**
   * Flex Message container
   */
  contents: FlexContainer;
};

/**
 * Message objects
 *
 * JSON object which contains the contents of the message you send.
 */
export type Message = (
  | TextMessage
  | ImageMessage
  | ImagemapMessage
  | VideoMessage
  | AudioMessage
  | LocationMessage
  | StickerMessage
  | TemplateMessage<Template>
  | FlexMessage
) &
  MessageOptions;

/**
 *
 */
type Area = {
  /**
   * Object describing the boundaries of the area in pixels.
   */
  bounds: {
    /**
     * Horizontal position of the top-left corner of the tappable area relative to the left edge of the image. Value must be `0` or higher.
     */
    x: number;

    /**
     * Vertical position of the top-left corner of the tappable area relative to the left edge of the image. Value must be `0` or higher.
     */
    y: number;

    /**
     * Width of the tappable area.
     */
    width: number;

    /**
     * Height of the tappable area.
     */
    height: number;
  };

  /**
   * Action performed when the area is tapped.
   */
  action: Action;
};

export type RichMenu = {
  /**
   * size object which contains the width and height of the rich menu displayed in the chat. Rich menu images must be one of the following sizes (pixels): 2500x1686, 2500x843, 1200x810, 1200x405, 800x540, 800x270
   */
  size: {
    width: 2500 | 1200 | 800;
    height: 1686 | 843 | 810 | 405 | 270;
  };

  /**
   * `true` to display the rich menu by default. Otherwise, `false`.
   */
  selected: boolean;

  /**
   * Name of the rich menu. This value can be used to help manage your rich menus and is not displayed to users.
   * - Max character limit: 300
   */
  name: string;

  /**
   * Text displayed in the chat bar
   * - Max character limit: 14
   */
  chatBarText: string;

  /**
   * Array of area objects which define the coordinates and size of tappable areas
   * - Max: 20 area objects
   */
  areas: Area[];
};

export type LiffApp = {
  /** LIFF app ID */
  liffId: string;

  view: LiffView;

  /**
   * Name of the LIFF app
   */
  description: string;

  features: LiffFeatures;
};

export type LiffView = {
  /**
   * Size of the LIFF app view. Specify one of the following values:
   * - `compact`: 50% of device screen height.
   * - `tall`: 80% of device screen height.
   * - `full`: 100% of device screen height.
   */
  type: 'compact' | 'tall' | 'full';

  /**
   * URL of the server on which the LIFF app is deployed (endpoint URL). The URL scheme must be https. Specify only the domain in this URL, without paths or query parameters.
   */
  url: string;
};

export type PartialLiffApp = {
  /** LIFF app ID */
  liffId?: string;

  view?: Partial<LiffView>;

  /** Name of the LIFF app */
  description?: string;

  features?: Partial<LiffFeatures>;
};

export type LiffFeatures = {
  /**
   * `true` if the LIFF app supports Bluetooth® Low Energy for [LINE Things](https://developers.line.biz/en/docs/line-things/). `false` otherwise.
   */
  ble: boolean;
};

export type MutationSuccessResponse = {};

export type ImageMapVideo = {
  /**
   * URL of the video file
   * - Max character limit: 1000
   * - HTTPS over TLS 1.2 or later
   * - mp4
   * - Max: 1 minute
   * - Max: 10 MB
   *
   * Note: A very wide or tall video may be cropped when played in some environments.
   */
  originalContentUrl: string;

  /**
   * URL of the preview image
   * - Max character limit: 1000
   * - HTTPS over TLS 1.2 or later
   * - JPEG
   * - Max: 240 x 240 pixels
   * - Max: 1 MB
   */
  previewImageUrl: string;

  area: {
    /** Horizontal position of the video area relative to the left edge of the imagemap area. Value must be 0 or higher. */
    x: number;

    /** Vertical position of the video area relative to the top of the imagemap area. Value must be 0 or higher. */
    y: number;

    /** Width of the video area */
    width: number;

    /** Height of the video area */
    height: number;
  };

  externalLink: {
    /**
     * Webpage URL. Called when the label displayed after the video is tapped.
Max character limit: 1000
The available schemes are http, https, line, and tel. For more information about the LINE URL scheme, see Using the LINE URL scheme.
    */
    linkUri: string;

    /**
     * Label. Displayed after the video is finished.
     * Max character limit: 30
     */
    label: string;
  };
};

export type Emoji = {
  /**
   * Index position for a character in text, with the first character being at position 0.
   * The specified position must correspond to a $ character, which serves as a placeholder for the LINE emoji.
   * If you specify a position that doesn't contain a $ character, the API returns HTTP 400 Bad request.
   * See the text message example for details.
   */
  index: number;
  /**
   * Product ID for a set of LINE emoji. See LINE Available Emoji List: https://d.line-scdn.net/r/devcenter/sendable_line_emoji_list.pdf.
   */
  productId: string;
  /**
   * ID for a LINE emoji inside a set. See LINE Available Emoji List: https://d.line-scdn.net/r/devcenter/sendable_line_emoji_list.pdf.
   */
  emojiId: string;
};

export type TextMessage = {
  type: 'text';
  /**
   * Message text. You can include the following emoji:
   *
   * Unicode emoji
   * LINE emoji (Use a $ character as a placeholder and specify details in the emojis property)
   * (Deprecated) LINE original emoji (Unicode code point table for LINE original emoji)
   *
   * Max character limit: 5000
   */
  text: string;
  /**
   * One or more LINE emoji.
   * Max: 20 LINE emoji
   */
  emojis?: Emoji[];
};

export type NumberOfMessagesSentResponse = InsightStatisticsResponse & {
  /**
   * The number of messages sent with the Messaging API on the date specified in date.
   * The response has this property only when the value of status is `ready`.
   */
  success?: number;
};

export type TargetLimitForAdditionalMessages = {
  /**
   * One of the following values to indicate whether a target limit is set or not.
   *  - `none`: This indicates that a target limit is not set.
   *  - `limited`: This indicates that a target limit is set.
   */
  type: 'none' | 'limited';
  /**
   * The target limit for additional messages in the current month.
   * This property is returned when the `type` property has a value of `limited`.
   */
  value?: number;
};

export type NumberOfMessagesSentThisMonth = {
  /**
   * The number of sent messages in the current month
   */
  totalUsage: number;
};

export type InsightStatisticsResponse = {
  /**
   * Calculation status. One of:
   * - `ready`: Calculation has finished; the numbers are up-to-date.
   * - `unready`: We haven't finished calculating the number of sent messages for the specified `date`. Calculation usually takes about a day. Please try again later.
   * - `out_of_service`: The specified `date` is earlier than the date on which we first started calculating sent messages. Different APIs have different date. Check them at the [document](https://developers.line.biz/en/reference/messaging-api/).
   */
  status: 'ready' | 'unready' | 'out_of_service';
};

export type NumberOfMessageDeliveries = InsightStatisticsResponse & {
  /**
   * Number of push messages sent to **all** of this LINE official account's friends (broadcast messages).
   */
  broadcast: number;
  /**
   * Number of push messages sent to **some** of this LINE official account's friends, based on specific attributes (targeted/segmented messages).
   */
  targeting: number;
  /**
   * Number of auto-response messages sent.
   */
  autoResponse: number;
  /**
   * Number of greeting messages sent.
   */
  welcomeResponse: number;
  /**
   * Number of messages sent from LINE Official Account Manager [Chat screen](https://www.linebiz.com/jp-en/manual/OfficialAccountManager/chats/screens/).
   */
  chat: number;
  /**
   * Number of broadcast messages sent with the [Send broadcast message](https://developers.line.biz/en/reference/messaging-api/#send-broadcast-message) Messaging API operation.
   */
  apiBroadcast: number;
  /**
   * Number of push messages sent with the [Send push message](https://developers.line.biz/en/reference/messaging-api/#send-push-message) Messaging API operation.
   */
  apiPush: number;
  /**
   * Number of multicast messages sent with the [Send multicast message](https://developers.line.biz/en/reference/messaging-api/#send-multicast-message) Messaging API operation.
   */
  apiMulticast: number;
  /**
   * Number of replies sent with the [Send reply message](https://developers.line.biz/en/reference/messaging-api/#send-reply-message) Messaging API operation.
   */
  apiReply: number;
};

export type NumberOfFollowers = InsightStatisticsResponse & {
  /**
   * The number of times, as of the specified `date`, that a user added this LINE official account as a friend. The number doesn't decrease when a user blocks the account after adding it, or when they delete their own account.
   */
  followers: number;
  /**
   * The number of users, as of the specified `date`, that the official account can reach with messages targeted by gender, age, or area. This number includes users for whom we estimated demographic attributes based on their activity in LINE and LINE-connected services.
   */
  targetedReaches: number;
  /**
   * The number of users blocking the account as of the specified `date`. The number decreases when a user unblocks the account.
   */
  blocks: number;
};

export type NumberOfMessageDeliveriesResponse =
  | InsightStatisticsResponse
  | NumberOfMessageDeliveries;

export type NumberOfFollowersResponse =
  | InsightStatisticsResponse
  | NumberOfFollowers;

type PercentageAble = {
  /**
   * Percentage
   */
  percentage: number;
};

export type FriendDemographics = {
  /**
   * `true` if friend demographic information is available.
   */
  available: boolean;
  /**
   * Percentage per gender
   */
  genders?: Array<
    {
      /**
       * Gender
       */
      gender: 'unknown' | 'male' | 'female';
    } & PercentageAble
  >;
  /**
   * Percentage per age group
   */
  ages?: Array<
    {
      /**
       * Age group
       */
      age: string;
    } & PercentageAble
  >;
  /**
   * Percentage per area
   */
  areas?: Array<
    {
      area: string;
    } & PercentageAble
  >;
  /**
   * Percentage by OS
   */
  appTypes?: Array<
    {
      appType: 'ios' | 'android' | 'others';
    } & PercentageAble
  >;
  /**
   * Percentage per friendship duration
   */
  subscriptionPeriods?: Array<
    {
      /**
       * Friendship duration
       */
      subscriptionPeriod:
        | 'over365days'
        | 'within365days'
        | 'within180days'
        | 'within90days'
        | 'within30days'
        | 'within7days'
        // in case for some rare cases(almost no)
        | 'unknown';
    } & PercentageAble
  >;
};

/* LINE Pay */
export type LinePayConfig = {
  channelId: string;
  channelSecret: string;
  sandbox?: boolean;
  origin?: string;
};

export type LinePayCurrency = 'USD' | 'JPY' | 'TWD' | 'THB';

/* Narrowcast */

export type NarrowcastOptions = {
  /**
   * Recipient object. You can specify recipients of the message using up to 10 audiences.
   *
   * If this is omitted, messages will be sent to all users who have added your LINE Official Account as a friend.
   */
  recipient?: RecipientObject;

  /**
   * Demographic filter object. You can use friends' attributes to filter the list of recipients.
   *
   * If this is omitted, messages are sent to everyone—including users with attribute values of "unknown".
   */
  demographic?: DemographicFilterObject;

  /**
   * The maximum number of narrowcast messages to send. Use this parameter to limit the number of narrowcast messages sent. The recipients will be chosen at random.
   */
  max?: number;
};

// reference: https://github.com/line/line-bot-sdk-nodejs/pull/193/files

/**
 * Logical operator objects
 *
 * Use logical AND, OR, and NOT operators to combine multiple recipient objects together.
 *
 * * Be sure to specify only one of these three properties (and, or, not). You cannot specify an empty array.
 */
export type FilterOperatorObject<T> = {
  type: 'operator';
} & (
  | {
      /**
       * Create a new recipient object by taking the logical conjunction (AND) of the specified array of recipient objects. *
       */
      and: T | (T | FilterOperatorObject<T>)[];
    }
  | {
      /**
       * Create a new recipient object by taking the logical disjunction (OR) of the specified array of recipient objects. *
       */
      or: T | (T | FilterOperatorObject<T>)[];
    }
  | {
      /**
       * Create a new recipient object that excludes the specified recipient object. *
       */
      not: T | (T | FilterOperatorObject<T>)[];
    }
);

export type AudienceObject = {
  type: 'audience';

  /**
   * The audience ID. Create audiences with the manage audience API.
   */
  audienceGroupId: number;
};

/**
 * Recipient objects
 *
 * Recipient objects represent audiences. You can specify recipients based on a combination of criteria using logical operator objects. You can specify up to 10 recipient objects per request.
 */
export type RecipientObject =
  | AudienceObject
  | FilterOperatorObject<AudienceObject>;

export type DemographicAge =
  | 'age_15'
  | 'age_20'
  | 'age_25'
  | 'age_30'
  | 'age_35'
  | 'age_40'
  | 'age_45'
  | 'age_50';

export type DemographicSubscriptionPeriod =
  | 'day_7'
  | 'day_30'
  | 'day_90'
  | 'day_180'
  | 'day_365';

export type DemographicArea =
  | 'jp_01'
  | 'jp_02'
  | 'jp_03'
  | 'jp_04'
  | 'jp_05'
  | 'jp_06'
  | 'jp_07'
  | 'jp_08'
  | 'jp_09'
  | 'jp_10'
  | 'jp_11'
  | 'jp_12'
  | 'jp_13'
  | 'jp_14'
  | 'jp_15'
  | 'jp_16'
  | 'jp_17'
  | 'jp_18'
  | 'jp_19'
  | 'jp_20'
  | 'jp_21'
  | 'jp_22'
  | 'jp_23'
  | 'jp_24'
  | 'jp_25'
  | 'jp_26'
  | 'jp_27'
  | 'jp_28'
  | 'jp_29'
  | 'jp_30'
  | 'jp_31'
  | 'jp_32'
  | 'jp_33'
  | 'jp_34'
  | 'jp_35'
  | 'jp_36'
  | 'jp_37'
  | 'jp_38'
  | 'jp_39'
  | 'jp_40'
  | 'jp_41'
  | 'jp_42'
  | 'jp_43'
  | 'jp_44'
  | 'jp_45'
  | 'jp_46'
  | 'jp_47'
  | 'tw_01'
  | 'tw_02'
  | 'tw_03'
  | 'tw_04'
  | 'tw_05'
  | 'tw_06'
  | 'tw_07'
  | 'tw_08'
  | 'tw_09'
  | 'tw_10'
  | 'tw_11'
  | 'tw_12'
  | 'tw_13'
  | 'tw_14'
  | 'tw_15'
  | 'tw_16'
  | 'tw_17'
  | 'tw_18'
  | 'tw_19'
  | 'tw_20'
  | 'tw_21'
  | 'tw_22'
  | 'th_01'
  | 'th_02'
  | 'th_03'
  | 'th_04'
  | 'th_05'
  | 'th_06'
  | 'th_07'
  | 'th_08'
  | 'id_01'
  | 'id_02'
  | 'id_03'
  | 'id_04'
  | 'id_06'
  | 'id_07'
  | 'id_08'
  | 'id_09'
  | 'id_10'
  | 'id_11'
  | 'id_12'
  | 'id_05';

/**
 * Demographic filter objects
 *
 * Demographic filter objects represent criteria (e.g. age, gender, OS, region, and friendship duration) on which to filter the list of recipients. You can filter recipients based on a combination of different criteria using logical operator objects.
 */
export type DemographicObject =
  | {
      type: 'gender';
      oneOf: ('male' | 'female')[];
    }
  | ({
      type: 'age';
    } & (
      | {
          gte: DemographicAge;
        }
      | {
          lt: DemographicAge;
        }
    ))
  | {
      type: 'appType';
      oneOf: ('ios' | 'android')[];
    }
  | {
      type: 'area';
      oneOf: DemographicArea[];
    }
  | ({
      type: 'subscriptionPeriod';
    } & (
      | {
          gte: DemographicSubscriptionPeriod;
        }
      | {
          lt: DemographicSubscriptionPeriod;
        }
    ));

export type DemographicFilterObject =
  | DemographicObject
  | FilterOperatorObject<DemographicObject>;

export type NarrowcastProgressResponse = (
  | {
      /**
       * The current status. One of:
       * - waiting: Messages are not yet ready to be sent. They are currently being filtered or processed in some way.
       * - sending: Messages are currently being sent.
       * - succeeded: Messages were sent successfully.
       * - failed: Messages failed to be sent. Use the failedDescription property to find the cause of the failure.
       */
      phase: 'waiting';
    }
  | ((
      | {
          /**
           * The current status. One of:
           * - waiting: Messages are not yet ready to be sent. They are currently being filtered or processed in some way.
           * - sending: Messages are currently being sent.
           * - succeeded: Messages were sent successfully.
           * - failed: Messages failed to be sent. Use the failedDescription property to find the cause of the failure.
           */
          phase: 'sending' | 'succeeded';
        }
      | {
          /**
           * The current status. One of:
           * - waiting: Messages are not yet ready to be sent. They are currently being filtered or processed in some way.
           * - sending: Messages are currently being sent.
           * - succeeded: Messages were sent successfully.
           * - failed: Messages failed to be sent. Use the failedDescription property to find the cause of the failure.
           */
          phase: 'failed';
          failedDescription: string;
        }
    ) & {
      successCount: number;
      failureCount: number;
      targetCount: string;
    })
) & {
  errorCode?: 1 | 2;
};

/* Audience */

export type CreateUploadAudienceGroupOptions = {
  /** The description to register for the job (in `jobs[].description`). */
  uploadDescription?: string;
};

export type UpdateUploadAudienceGroupOptions = CreateUploadAudienceGroupOptions & {
  /**
   * The audience's name. Audience names must be unique. This is case-insensitive, meaning AUDIENCE and audience are considered identical.
   * - Max character limit: 120
   */
  description?: string;
};

export type CreateClickAudienceGroupOptions = {
  /**
   * The URL clicked by the user. If empty, users who clicked any URL in the message are added to the list of recipients.
   * - Max character limit: 2,000
   */
  clickUrl?: string;
};

export type Audience = {
  /** A user ID or IFA. */
  id: string;
};

export type BasicAudienceGroup = {
  /** The audience ID. */
  audienceGroupId: number;

  /** The audience's name. */
  description: string;

  /** When the audience was created (in UNIX time). */
  created: number;

  /**
   * The value specified when creating an audience for uploading user IDs to indicate the type of accounts that will be given as recipients. One of:
   * - true: Accounts are specified with IFAs.
   * - false (default): Accounts are specified with user IDs.
   */
  isIfaAudience: string;

  /**
   * Audience's update permission. Audiences linked to the same channel will be READ_WRITE.
   * - READ: Can use only.
   * - READ_WRITE: Can use and update.
   */
  permission: 'READ' | 'READ_WRITE';

  /** How the audience was created. If omitted, all audiences are included. */
  createRoute: 'OA_MANAGER' | 'MESSAGING_API';
};

export type UploadAudienceGroup = BasicAudienceGroup & {
  type: 'UPLOAD';
};

export type ImpAudienceGroup = BasicAudienceGroup & {
  type: 'IMP';

  // The request ID that was specified when the audience was created.
  requestId: string;
};

export type ClickAudienceGroup = BasicAudienceGroup & {
  type: 'CLICK';

  /** The request ID that was specified when the audience was created. */
  requestId: string;

  /** The URL that was specified when the audience was created. */
  clickUrl?: string;
};

export type AudienceGroup = (
  | UploadAudienceGroup
  | ImpAudienceGroup
  | ClickAudienceGroup
) & {
  audienceCount: number;
} & (
    | {
        status: 'IN_PROGRESS' | 'READY' | 'EXPIRED';
      }
    | {
        status: 'FAILED';
        failedType: 'AUDIENCE_GROUP_AUDIENCE_INSUFFICIENT' | 'INTERNAL_ERROR';
      }
  );

export type AudienceGroups = {
  /** An array of audience data. */
  audienceGroups: AudienceGroup[];

  /** true when this is not the last page. */
  hasNextPage: boolean;

  /** The total number of audiences that can be returned with the specified filter. */
  totalCount: number;

  /** Of the audiences you can get with the specified condition, the number of audiences with the update permission set to READ_WRITE. */
  readWriteAudienceGroupTotalCount: number;

  /** The current page number. */
  page: number;

  /** The number of audiences on the current page. */
  size: number;
};

export type Job = {
  /** A job ID. */
  audienceGroupJobId: number;

  /** An audience ID. */
  audienceGroupId: number;

  /** The job's description. */
  description: string;

  /**
   * The job's type. One of:
   * - DIFF_ADD: Indicates that a user ID or IFA was added via the Messaging API.
   */
  type: 'DIFF_ADD';

  /** The number of accounts (recipients) that were added or removed. */
  audienceCount: number;

  /** When the job was created (in UNIX time). */
  created: number;
} & (
  | {
      /** The job's status. */
      jobStatus: 'QUEUED' | 'WORKING' | 'FINISHED';
    }
  | {
      /** The job's status. */
      jobStatus: 'FAILED';

      /** The reason why the operation failed. This is only included when jobs[].jobStatus is */
      failedType: 'INTERNAL_ERROR';
    }
);

export type AudienceGroupWithJob = AudienceGroup & {
  /** An array of jobs. This array is used to keep track of each attempt to add new user IDs or IFAs to an audience for uploading user IDs. null is returned for any other type of audience. */
  jobs: Job[];
};

export type GetAudienceGroupsOptions = {
  /**
   * The page to return when getting (paginated) results. Must be `1` or higher.
   */
  page?: number;
  /**
   * The name of the audience(s) to return. You can search for partial matches. This is case-insensitive, meaning `AUDIENCE` and `audience` are considered identical.
   */
  description?: string;
  /**
   * The status of the audience(s) to return. One of:
   * - `IN_PROGRESS`: Pending. It may take several hours for the status to change to `READY`.
   * - `READY`: Ready to accept messages.
   * - `FAILED`: An error occurred while creating the audience.
   * - `EXPIRED`: Expired. Audiences are automatically deleted a month after they expire.
   */
  status?: 'IN_PROGRESS' | 'READY' | 'FAILED' | 'EXPIRED';
  /**
   * The number of audiences per page. Default: 20
   * - Max: 40
   */
  size?: number;

  /**
   * - `true`: Get public audiences created in all channels linked to the same bot.
   * - `false`: Get audiences created in the same channel.
   */
  includesExternalPublicGroups?: boolean;

  /**
   * How the audience was created. If omitted, all audiences are included.
   * - `OA_MANAGER`: Return only audiences created with [LINE Official Account Manager](https://manager.line.biz/).
   * - `MESSAGING_API`: Return only audiences created with Messaging API.
   */
  createRoute?: string;
};

export type AudienceGroupAuthorityLevel = {
  /**
   * The authority level for all audiences linked to a channel
   * - `PUBLIC`: The default authority level. Audiences will be available in channels other than the one where you created the audience. For example, it will be available in [LINE Official Account Manager](https://manager.line.biz/), [LINE Ad Manager](https://admanager.line.biz/), and all channels the bot is linked to.
   * - `PRIVATE`: Audiences will be available only in the channel where you created the audience.
   */
  authorityLevel: 'PUBLIC' | 'PRIVATE';
};

/**
 * LINE Notify Config
 */
export type LineNotifyConfig = {
  /**
   * LINE Notify Service Client ID
   */
  clientId: string;

  /**
   * LINE Notify Service Client Secret
   */
  clientSecret: string;

  /**
   * LINE Notify Service Callback URL
   */
  redirectUri: string;

  /**
   * LINE Notify Authentication URL origin
   */
  origin?: string;

  /**
   * LINE Notify Notification URL origin
   */
  apiOrigin?: string;
};

export type LineNotifyOptions = {
  /**
   * Maximum size of 240×240px JPEG
   */
  imageThumbnail?: string;

  /**
   * Maximum size of 2048×2048px JPEG
   */
  imageFullsize?: string;

  /**
   * Package ID.
   */
  stickerPackageId?: number;

  /**
   * 	Sticker ID.
   */
  stickerId?: number;

  /**
   * - true: The user doesn't receive a push notification when the message is sent.
   * - false: The user receives a push notification when the message is sent (unless they have disabled push notification in LINE and/or their device).
   *
   * If omitted, the value defaults to false.
   */
  notificationDisabled?: boolean;
};

/**
 * Response body of get bot info.
 *
 * @see [Get bot info](https://developers.line.biz/en/reference/messaging-api/#get-bot-info)
 */
export type BotInfoResponse = {
  /**
   * Bot's user ID
   */
  userId: string;
  /**
   * Bot's basic ID
   */
  basicId: string;
  /**
   * Bot's premium ID. Not included in the response if the premium ID isn't set.
   */
  premiumId?: string;
  /**
   * Bot's display name
   */
  displayName: string;
  /**
   * Profile image URL. "https" image URL. Not included in the response if the bot doesn't have a profile image.
   */
  pictureUrl: string;
  /**
   * Bot's response mode set in the LINE Official Account Manager. One of:
   * - chat: The response mode is set to "Chat".
   * - bot: The response mode is set to "Bot".
   */
  chatMode: 'chat' | 'bot';
  /**
   * Automatic read setting for messages. If the bot's response mode is "Bot", auto is returned. If the response mode is "Chat", manual is returned.
   * - auto: Auto read setting is enabled.
   * - manual: Auto read setting is disabled.
   */
  markAsReadMode: 'auto' | 'manual';
};

/**
 * Response body of get webhook endpoint info.
 *
 * @see [Get get webhook endpoint info](https://developers.line.biz/en/reference/messaging-api/#get-webhook-endpoint-information)
 */
export type WebhookEndpointInfoResponse = {
  /**
   * Webhook URL
   */
  endpoint: string;
  /**
   * Webhook usage status. Send a webhook event from the LINE platform to the webhook URL only if enabled.
   * - true: Webhook usage is enabled.
   * - false: Webhook usage is disabled.
   */
  active: boolean;
};

/**
 * Response body of test webhook endpoint.
 *
 * @see [Test webhook endpoint](https://developers.line.biz/en/reference/messaging-api/#test-webhook-endpoint)
 */
export type TestWebhookEndpointResponse = {
  /**
   * Result of the communication from the LINE platform to the webhook URL.
   * - true: Success
   * - false: Failure
   */
  success: boolean;
  /**
   * Time of the event in milliseconds
   */
  timestamp: string;
  /**
   * The HTTP status code. If the webhook response isn't received, the status code is set to zero or a negative number.
   */
  statusCode: number;
  /**
   * Reason for the response.
   */
  reason: string;
  /**
   * Details of the response.
   */
  detail: string;
};
