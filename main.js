import { findByStatusTest } from './petstore-perf-test/pet/find-by-status-test.js';
import { postPetTest } from './petstore-perf-test/pet/post-pet-test.js';
import { postOrderTest } from './petstore-perf-test/store/post-order-test.js';
import { getInventoryTest } from './petstore-perf-test/store/get-inventory-test.js';

const BASE_URL = 'https://petstore.swagger.io/v2';

export const options = {
    scenarios: {
        findByStatus: {
            executor: 'constant-vus',
            vus: 5,
            duration: '30s',
        },
        postPet: {
            executor: 'per-vu-iterations',
            vus: 3,
            iterations: 10,
            maxDuration: '30s',
        },
        postOrder: {
            executor: 'per-vu-iterations',
            vus: 3,
            iterations: 10,
            maxDuration: '30s',
        },
        getInventory: {
            executor: 'constant-vus',
            vus: 5,
            duration: '30s',
        },
    },
};

export default function () {
    findByStatusTest(BASE_URL);
    postPetTest(BASE_URL);
    postOrderTest(BASE_URL);
    getInventoryTest(BASE_URL);
}