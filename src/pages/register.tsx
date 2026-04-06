import React from "react";
import { Link, useHistory } from "react-router-dom";
import { Card, CardBody, CardHeader, CardFooter, Input, Button, Divider } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useAuth } from "../contexts/auth-context";

export const Register: React.FC = () => {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const { register } = useAuth();
  const history = useHistory();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }
    setIsLoading(true);

    try {
      await register(name, email, password);
      history.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Ошшибка создания аккаунта");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-2">
            <Icon icon="lucide:book-open" width={40} height={40} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold">EduPlatform</h1>
          <p className="text-default-500">Новый аккаунт</p>
        </div>

        <Card className="w-full" disableRipple>
          <CardHeader className="flex flex-col gap-1 items-start">
            <h2 className="text-xl font-semibold">Регистрация</h2>
            <p className="text-default-500 text-small">Новый аккаунт</p>
          </CardHeader>
          <Divider />
          <CardBody>
            {error && (
              <div className="bg-danger-50 text-danger p-3 rounded-medium mb-4 text-small">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Имя"
                isRequired
                autoComplete="name"
              />
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Введите электронную почту"
                isRequired
                autoComplete="email"
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                isRequired
                autoComplete="new-password"
              />
              <Input
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Подтвердите пароль"
                isRequired
                autoComplete="new-password"
              />
              <Button
                type="submit"
                color="primary"
                fullWidth
                isLoading={isLoading}
              >
                Create Account
              </Button>
            </form>
          </CardBody>
          <Divider />
          <CardFooter className="flex justify-center">
            <p className="text-default-500 text-small">
              Уже есть аккаунт?{" "}
              <Link to="/login" className="text-primary font-medium">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};