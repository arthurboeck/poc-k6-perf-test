import http from 'k6/http';
import { check, sleep } from 'k6';
import { expect } from 'https://jslib.k6.io/k6-testing/0.6.1/index.js';

const path = '/store/order';

const params = {
    headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
    },
};

const payload = JSON.stringify({
    id: 0,
    petId: 0,
    quantity: 0,
    shipDate: '2026-07-11T15:47:40.824Z',
    status: 'placed',
    complete: true,
});

export function postOrderTest(baseUrl) {
    const response = http.post(baseUrl + path, payload, params);

    expect(response.status).toBe(200);
    expect.soft(response.status).toBe(200);

    check(response, {
        'status is 200': (r) => r.status === 200,
    });

    sleep(1);
}
