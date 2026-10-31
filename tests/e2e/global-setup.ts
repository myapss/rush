import { seedFixtures } from "./fixtures";

export default async function globalSetup() {
  await seedFixtures();
}
