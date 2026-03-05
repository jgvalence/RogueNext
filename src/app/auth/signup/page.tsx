"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  RogueAlert,
  RogueButton,
  RogueCard,
  RogueForm,
  RogueFormItem,
  RogueInput,
} from "@/components/ui/rogue";
import { signUpAction } from "@/server/actions/auth";

interface SignUpFormValues {
  name?: string;
  email: string;
  password: string;
}

function SignUpForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/game";

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(values: SignUpFormValues) {
    setError(null);
    setLoading(true);

    const signUpResult = await signUpAction({
      name: values.name ?? "",
      email: values.email,
      password: values.password,
    });

    if (!signUpResult.success) {
      setLoading(false);
      setError(signUpResult.error.message);
      return;
    }

    const signInResult = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    setLoading(false);

    if (signInResult?.error) {
      setError(t("auth.signup.autoSigninError"));
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-900/20 blur-[128px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <RogueButton
          onClick={() => router.push("/")}
          className="!mb-8 !inline-flex !items-center !gap-1 !border-0 !bg-transparent !px-0 !text-sm !text-gray-500 hover:!text-gray-300"
        >
          {"<-"} {t("auth.back")}
        </RogueButton>

        <RogueCard
          className="rounded-2xl border border-gray-800 bg-gray-900/70"
          styles={{ body: { padding: 24 } }}
        >
          <div className="mb-8 text-center">
            <h1 className="bg-gradient-to-b from-white to-gray-400 bg-clip-text text-3xl font-black tracking-tight text-transparent">
              Panlibrarium
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              {t("auth.signup.subtitle")}
            </p>
          </div>

          <RogueForm
            layout="vertical"
            onFinish={handleSubmit}
            className="[&_.ant-form-item-label>label]:!text-sm [&_.ant-form-item-label>label]:!font-medium [&_.ant-form-item-label>label]:!text-gray-400 [&_.ant-form-item]:!mb-4"
          >
            <RogueFormItem name="name" label={t("auth.signup.nameOptional")}>
              <RogueInput
                placeholder={t("auth.signup.namePlaceholder")}
                autoComplete="name"
                className="!bg-gray-900"
              />
            </RogueFormItem>

            <RogueFormItem
              name="email"
              label="Email"
              rules={[{ required: true, type: "email" }]}
            >
              <RogueInput
                placeholder="user@example.com"
                autoComplete="email"
                className="!bg-gray-900"
              />
            </RogueFormItem>

            <RogueFormItem
              name="password"
              label={t("auth.password")}
              rules={[{ required: true, min: 6 }]}
            >
              <RogueInput
                type="password"
                placeholder={t("auth.signup.passwordPlaceholder")}
                autoComplete="new-password"
                className="!bg-gray-900"
              />
            </RogueFormItem>

            {error && (
              <RogueAlert
                type="error"
                showIcon
                message={error}
                className="!mb-4 !rounded-lg !border !border-red-800 !bg-red-900/30"
              />
            )}

            <RogueButton
              htmlType="submit"
              type="primary"
              loading={loading}
              className="!mt-1 !h-auto !w-full !rounded-lg !bg-purple-600 !py-3 !font-bold hover:!bg-purple-500"
            >
              {loading ? t("auth.signup.loading") : t("auth.signup.submit")}
            </RogueButton>
          </RogueForm>

          <p className="mt-6 text-center text-sm text-gray-500">
            {t("auth.signup.hasAccount")}{" "}
            <Link
              href="/auth/signin"
              className="text-purple-400 hover:text-purple-300"
            >
              {t("auth.signup.goSignin")}
            </Link>
          </p>
        </RogueCard>
      </div>
    </main>
  );
}

export default function SignUpPage() {
  const { t } = useTranslation();
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
          {t("gameHub.loading")}
        </div>
      }
    >
      <SignUpForm />
    </Suspense>
  );
}
