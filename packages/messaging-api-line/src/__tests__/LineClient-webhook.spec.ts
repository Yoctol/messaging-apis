import MockAdapter from 'axios-mock-adapter';

import LineClient from '../LineClient';

const ACCESS_TOKEN = '1234567890';
const CHANNEL_SECRET = 'so-secret';

const createMock = (): {
  client: LineClient;
  mock: MockAdapter;
  headers: {
    Accept: string;
    'Content-Type': string;
    Authorization: string;
  };
} => {
  const client = new LineClient({
    accessToken: ACCESS_TOKEN,
    channelSecret: CHANNEL_SECRET,
  });
  const mock = new MockAdapter(client.axios);
  const headers = {
    Accept: 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${ACCESS_TOKEN}`,
  };
  return { client, mock, headers };
};

describe('#getBotInfo', () => {
  it('should call api', async () => {
    const { client, mock } = createMock();

    const reply = {
      userId: 'Ub9952f8...',
      basicId: '@216ru...',
      displayName: 'Example name',
      pictureUrl: 'https://obs.line-apps.com/...',
      chatMode: 'chat',
      markAsReadMode: 'manual',
    };

    let url;
    let headers;
    mock.onGet().reply((config) => {
      url = config.url;
      headers = config.headers;
      return [200, reply];
    });

    const res = await client.getBotInfo();

    expect(url).toEqual('/v2/bot/info');
    expect(headers).toEqual(headers);

    expect(res).toEqual(reply);
  });
});

describe('#getWebhookEndpointInfo', () => {
  it('should call api', async () => {
    const { client, mock } = createMock();

    const reply = {
      endpoint: 'https://example.herokuapp.com/test',
      active: true,
    };

    let url;
    let headers;
    mock.onGet().reply((config) => {
      url = config.url;
      headers = config.headers;
      return [200, reply];
    });

    const res = await client.getWebhookEndpointInfo();

    expect(url).toEqual('/v2/bot/channel/webhook/endpoint');
    expect(headers).toEqual(headers);

    expect(res).toEqual(reply);
  });
});

describe('#setWebhookEndpointUrl', () => {
  it('should call api', async () => {
    const { client, mock } = createMock();

    const reply = {};

    let url;
    let headers;
    mock.onPut().reply((config) => {
      url = config.url;
      headers = config.headers;
      return [200, reply];
    });

    const res = await client.setWebhookEndpointUrl(
      'https://example.herokuapp.com/test'
    );

    expect(url).toEqual('/v2/bot/channel/webhook/endpoint');
    expect(headers).toEqual(headers);

    expect(res).toEqual(reply);
  });
});

describe('#testWebhookEndpoint', () => {
  it('should call api', async () => {
    const { client, mock } = createMock();

    const reply = {
      success: true,
      timestamp: '2020-09-30T05:38:20.031Z',
      statusCode: 200,
      reason: 'OK',
      detail: '200',
    };

    let url;
    let headers;
    mock.onPost().reply((config) => {
      url = config.url;
      headers = config.headers;
      return [200, reply];
    });

    const res = await client.testWebhookEndpoint();

    expect(url).toEqual('/v2/bot/channel/webhook/test');
    expect(headers).toEqual(headers);

    expect(res).toEqual(reply);
  });
});
