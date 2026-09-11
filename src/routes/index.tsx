import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Github, Layout, Palette, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Starter — Modern React App" },
      {
        name: "description",
        content:
          "A clean TanStack Start, Tailwind CSS and shadcn/ui starter ready for GitHub integration.",
      },
      {
        property: "og:title",
        content: "Starter — Modern React App",
      },
      {
        property: "og:description",
        content:
          "A clean TanStack Start, Tailwind CSS and shadcn/ui starter ready for GitHub integration.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="h-4 w-4" />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              Starter
            </span>
          </div>
          <nav className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <Github className="h-5 w-5" />
              <span className="sr-only">GitHub</span>
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-6">
              Ready for GitHub
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Build faster with a clean foundation
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              TanStack Start, Tailwind CSS and shadcn/ui are wired up and ready
              to go. Connect your repository and start shipping.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button asChild size="lg">
                <Link to="/">
                  Get started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Github className="mr-2 h-4 w-4" />
                  Connect GitHub
                </a>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <Layout className="mb-2 h-6 w-6 text-primary" />
                <CardTitle>TanStack Start</CardTitle>
                <CardDescription>
                  Type-safe routing, server functions and data loading out of
                  the box.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  File-based routing, SSR-ready layouts and a modern React 19
                  runtime.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Palette className="mb-2 h-6 w-6 text-primary" />
                <CardTitle>Tailwind CSS v4</CardTitle>
                <CardDescription>
                  CSS-first configuration with semantic design tokens.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Utility-first styling with light and dark mode support built
                  in.
                </p>
              </CardContent>
            </Card>

            <Card className="sm:col-span-2 lg:col-span-1">
              <CardHeader>
                <Zap className="mb-2 h-6 w-6 text-primary" />
                <CardTitle>shadcn/ui</CardTitle>
                <CardDescription>
                  Accessible, composable components already installed.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Buttons, cards, dialogs, forms and more — ready to customize.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
          Built with Lovable — ready for your next idea.
        </div>
      </footer>
    </div>
  );
}
