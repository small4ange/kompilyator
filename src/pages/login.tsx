import React from "react";
import { Link, useHistory } from "react-router-dom";
import { Card, CardBody, CardHeader, CardFooter, Input, Button, Divider } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useAuth } from "../contexts/auth-context";

export const Login: React.FC = () => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const { login } = useAuth();
  const history = useHistory();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
      history.push("/dashboard");
    } catch (err) {
      setError("Invalid email or password");
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
          <h1 className="text-2xl font-bold">Компилятор</h1>
          <p className="text-default-500">Войдите в свой аккаунт</p>
        </div>

        <Card className="w-full" disableRipple>
          <CardHeader className="flex flex-col gap-1 items-start">
            <h2 className="text-xl font-semibold">Вход</h2>
            <p className="text-default-500 text-small">Введите свои учетные данные для продолжения</p>
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
                label="Почта"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Введите почту"
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
                autoComplete="current-password"
              />
              <Button
                type="submit"
                color="primary"
                fullWidth
                isLoading={isLoading}
              >
                Вход
              </Button>
            </form>
          </CardBody>
          <Divider />
          <CardFooter className="flex justify-center">
            <p className="text-default-500 text-small">
              Нет аккаунта?{" "}
              <Link to="/register" className="text-primary font-medium">
                Регистрация
              </Link>
            </p>
          </CardFooter>
        </Card>

        <div className="mt-4 text-center text-small text-default-500"  style={{ display: 'none' }}>
          <p>Demo accounts:</p>
          <p>Admin: admin@example.com / admin123</p>
          <p>User: user@example.com / user123</p>
        </div>
      </div>
    </div>
  );
};