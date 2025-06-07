import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Header } from "@/components/ui/header";
import { ArrowRight, Banknote, CreditCard, Lock, Wallet } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center px-4">
      <Header />
      <section
        id="#hero"
        className="mt-24 flex flex-col items-center justify-center gap-4 text-center md:w-8/12"
      >
        <h2 className="text-5xl font-bold">Take control of your finances</h2>
        <p className="text-muted-foreground text-2xl">
          A simple, intuitive personal finance app to help you track expenses,
          manage accounts, and achieve your financial goals.
        </p>
        <div className="flex gap-4">
          <Link href="/signup" className="flex items-center gap-2">
            <Button>
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="#features">
            <Button variant="outline">Learn More</Button>
          </Link>
        </div>
      </section>
      <section
        id="#features"
        className="mt-24 flex flex-col items-center justify-center gap-4 text-center md:w-8/12"
      >
        <h2 className="text-5xl font-bold">Features</h2>
        <p className="text-muted-foreground text-2xl">
          Everything you need to manage your personal finances in one place.
        </p>
        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
          {[
            {
              title: "Multiple Accounts",
              description:
                "Manage cash, bank accounts, and savings all in one place",
              icon: <Banknote className="h-10 w-10" />,
            },
            {
              title: "Debt Management",
              description:
                "Track and manage your debts to become debt-free faster",
              icon: <CreditCard className="h-10 w-10" />,
            },
            {
              title: "Budget Planning",
              description: "Create and manage budgets to control your spending",
              icon: <Wallet className="h-10 w-10" />,
            },
            {
              title: "Secure & Private",
              description: "Your financial data is encrypted and never shared",
              icon: <Lock className="h-10 w-10" />,
            },
          ].map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <CardTitle className="flex flex-col items-center gap-2">
                  <div className="text-primary flex h-16 w-16 items-center justify-center gap-2 rounded-full bg-gray-200 p-2">
                    {feature.icon}
                  </div>
                  <p className="text-center text-2xl font-bold">
                    {feature.title}
                  </p>
                </CardTitle>
                <CardDescription className="text-muted-foreground text-center text-lg">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
