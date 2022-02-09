import { redirect, useActionData, json, Form, useTransition } from "remix";
import type { ActionFunction } from "remix";
import { getUser } from "~/utils/session.server";
import { createPost } from "~/utils/db/post.server";
import { Post, Prisma } from "@prisma/client";
import { ExclamationCircleIcon } from "@heroicons/react/solid";
import invariant from "tiny-invariant";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Typography from "@tiptap/extension-typography";
import Image from "@tiptap/extension-image";
import Dropcursor from "@tiptap/extension-dropcursor";
import { PhotographIcon, CodeIcon } from "@heroicons/react/solid";

function validateTitle(title: string) {
  if (typeof title !== "string" || title.length < 3) {
    return "Title should be at least 3 characters long";
  }
}

function validateUserId(userId: number) {
  if (typeof userId === undefined) {
    return "Expected a user id";
  }
}

export const action: ActionFunction = async ({ request }) => {
  const user = await getUser(request);
  invariant(user?.id, "expected user id");

  const form = await request.formData();
  const formbody = form.get("body");

  invariant(formbody, "expect formbody to exist");

  const post = {
    title: form.get("title"),
    description: "the best 90's tunes",
    //@ts-ignore
    body: JSON.parse(formbody) as unknown as Prisma.JsonObject,
    tags: [] as Prisma.JsonArray,
    imageUrl: "http",
    userId: user.id,
  } as Post;

  const errors = {
    title: validateTitle(post.title),
    body: "",
    category: "",
    imageUrl: "",
    readingTime: "",
    userId: validateUserId(post.userId),
  };

  // Return errors
  if (Object.values(errors).some(Boolean)) {
    return json({ errors, post }, { status: 422 }); // Unprocessable entity
  }

  await createPost(post);

  return redirect(`/posts`);
};

export default function NewPost() {
  const actionData = useActionData();
  const transition = useTransition();

  const editor = useEditor({
    extensions: [StarterKit, Highlight, Typography, Image, Dropcursor],
    editorProps: {
      attributes: {
        class:
          "prose prose-gray focus:outline-none mt-2 w-full p-3 border-t-2 border-white",
      },
    },
    content: ``,
  });

  const addImage = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    const url = window.prompt("URL");

    if (url) {
      editor?.chain().focus().setImage({ src: url }).run();
    }
  };

  const json = editor?.getJSON();

  return (
    <Form
      method="post"
      encType="multipart/form-data"
      className="space-y-8 divide-y divide-gray-200"
    >
      <div className="space-y-8 divide-y divide-gray-200">
        <div>
          <h3 className="text-lg font-medium leading-6 text-light dark:text-dark">
            New Post
          </h3>
          <p className="mt-1 text-sm">
            Use this form to create a new blog post using markdown syntax.
          </p>
        </div>

        <fieldset disabled={transition.state === "submitting"} className="pt-6">
          <label htmlFor="title" className="block text-sm font-medium">
            Title
          </label>
          <div className="relative mt-1 rounded-md shadow-sm">
            <input
              type="text"
              name="title"
              id="title"
              className={`${
                actionData?.errors.title
                  ? "block w-full rounded-md border-red-300 pr-10 text-red-900 placeholder-red-300 focus:border-red-500 focus:outline-none focus:ring-red-500 sm:text-sm"
                  : "block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
              }`}
              defaultValue={actionData?.fields?.title}
              aria-invalid="true"
              aria-describedby="title-error"
            />
            {actionData?.errors.title && (
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <ExclamationCircleIcon
                  className="h-5 w-5 text-red-500"
                  aria-hidden="true"
                />
              </div>
            )}
          </div>
          <p className="mt-2 text-sm text-red-600" id="title-error">
            {actionData?.errors.title && actionData?.errors.title}
          </p>

          <div className="pt-6">
            <span className="relative z-0 inline-flex rounded-md shadow-sm">
              <button
                onClick={addImage}
                type="button"
                className="relative inline-flex items-center rounded-l-md border border-gray-50 bg-light px-2 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-dark dark:hover:text-gray-100"
              >
                <span className="sr-only">Previous</span>
                <PhotographIcon className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                onClick={addImage}
                type="button"
                className="relative inline-flex items-center border-t border-b border-gray-50 bg-light px-2 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-dark dark:hover:text-gray-100"
              >
                <span className="sr-only">Previous</span>
                <PhotographIcon className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="0 relative -ml-px inline-flex items-center rounded-r-md border border-gray-50 bg-light px-2 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-dark dark:hover:text-gray-100"
              >
                <span className="sr-only">Next</span>
                <CodeIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </span>

            <div>
              <EditorContent editor={editor} />
              <input
                type="hidden"
                name="body"
                id="body"
                value={JSON.stringify(json)}
              />
              <p className="mt-2 text-sm text-red-600" id="body-error">
                {actionData?.errors.body && actionData?.errors.body}
              </p>
              <p className="mt-2 text-sm text-red-600" id="userid-error">
                {actionData?.errors.userId && actionData?.errors.userId}
              </p>
            </div>
          </div>

          <div className="pt-5">
            <div className="flex justify-end">
              <button
                type="button"
                className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="ml-3 inline-flex items-center rounded-md border border-transparent bg-sky-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
              >
                {transition.state !== "idle" ? "Adding post..." : "Add post"}
              </button>
            </div>
          </div>
        </fieldset>
      </div>
    </Form>
  );
}
