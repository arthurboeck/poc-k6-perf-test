import http from 'k6/http';
import { check, sleep } from 'k6';
import { expect } from 'https://jslib.k6.io/k6-testing/0.6.1/index.js';

const path = '/store/inventory';

const params = {
    headers: {
        accept: 'application/json',
    },
};

export function getInventoryTest(baseUrl) {
    const response = http.get(baseUrl + path, params);

    expect(response.status).toBe(200);
    expect.soft(response.status).toBe(200);

    check(response, {
        'status is 200': (r) => r.status === 200,
    });

    sleep(1);
}
