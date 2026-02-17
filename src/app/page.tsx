import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-4xl">
        {/* Hero Section */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Base Next.js Template
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            A professional Next.js starter with TypeScript, Tailwind CSS,
            Prisma, NextAuth, and more. Built with best practices for
            production-ready applications.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/dashboard">
              <Button size="lg">Get Started</Button>
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="lg">
                View on GitHub
              </Button>
            </a>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>TypeScript Strict</CardTitle>
              <CardDescription>
                Fully typed with strict TypeScript configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                All code is strictly typed with noImplicitAny and strict null
                checks enabled.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Authentication</CardTitle>
              <CardDescription>NextAuth v5 with RBAC</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Complete authentication setup with role-based access control and
                OAuth providers.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Database Ready</CardTitle>
              <CardDescription>Prisma ORM with PostgreSQL</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Production-ready database schema with migrations, seed data, and
                connection pooling.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Error Handling</CardTitle>
              <CardDescription>Standardized error system</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Business and technical errors handled consistently across the
                application.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Design System</CardTitle>
              <CardDescription>Reusable UI components</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Built with Tailwind CSS and Ant Design, with custom reusable
                components.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Production Ready</CardTitle>
              <CardDescription>Monitoring & deployment</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Sentry integration, Vercel deployment, and comprehensive testing
                setup.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tech Stack */}
        <div className="mt-24">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
            Built with Modern Tech Stack
          </h2>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-8">
            {[
              "Next.js 15",
              "React 19",
              "TypeScript",
              "Tailwind CSS",
              "Prisma",
              "PostgreSQL",
              "NextAuth",
              "React Query",
              "Zod",
              "Sentry",
            ].map((tech) => (
              <div
                key={tech}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900"
              >
                {tech}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
