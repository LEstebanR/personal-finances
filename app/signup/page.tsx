import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/ui/logo'
import Link from 'next/link'

export default function Signup() {
  return (
    <div className="mx-auto mt-24 flex w-full flex-col items-center gap-4 px-4">
      <Logo />
      <Card className="flex w-full flex-col md:w-4/12">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            Create an account
          </CardTitle>
          <CardDescription className="text-muted-foreground text-center text-lg">
            Enter your information to create an account
          </CardDescription>
          <CardContent>
            <form className="mt-4 flex w-full flex-col gap-6">
              <div className="grid gap-2 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" type="text" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" type="text" required />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input id="password" type="password" required />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                </div>
                <Input id="confirmPassword" type="password" required />
              </div>
              <Button type="submit">Create account</Button>
            </form>
          </CardContent>
          <CardFooter className="mt-4 flex flex-col gap-2">
            <p className="text-muted-foreground text-center text-lg">
              Already have an account?{' '}
              <Link href="/login" className="text-primary">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </CardHeader>
      </Card>
    </div>
  )
}
