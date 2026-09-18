import http from 'k6/http';
import { check, sleep } from 'k6';
import { expect } from 'https://jslib.k6.io/k6-testing/0.6.1/index.js';
import { URL } from 'https://jslib.k6.io/url/1.0.0/index.js';

const path = '/pet/findByStatus';
const queryParams = {
    status: 'available',
};

const params = {
    headers: {
        accept: 'application/json',
    },
};

export function findByStatusTest(baseUrl) {
    const url = new URL(baseUrl + path);
    url.searchParams.set('status', queryParams.status);

    const response = http.get(url.toString(), params);

    expect(response.status).toBe(200);
    expect.soft(response.status).toBe(200);

    check(response, {
        'status is 200': (r) => r.status === 200,
    });

    sleep(1);
}
