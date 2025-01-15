import { createApiRoot } from "../client/create.client";

export const fetchCustomObject = async ({
  container,
  key,
}: {
  container: string;
  key: string;
}) => {
  try {
    const { body } = await createApiRoot()
      .customObjects()
      .withContainerAndKey({
        container,
        key,
      })
      .get()
      .execute();

    return body;
  } catch (error) {
    return { value: null };
  }
};

export const updateCustomObject = async ({
  container,
  key,
  value,
}: {
  container: string;
  key: string;
  value: string;
}) => {
  await createApiRoot()
    .customObjects()
    .post({ body: { container, key, value } })
    .execute();
};

export const deleteCustomObject = async ({
  container,
  key,
}: {
  container: string;
  key: string;
}) => {
  try {
    await createApiRoot()
      .customObjects()
      .withContainerAndKey({
        container,
        key,
      })
      .delete()
      .execute();
  } catch (error) {
    return;
  }
};
