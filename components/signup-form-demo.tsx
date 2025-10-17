"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { IconEye, IconEyeOff, IconLock, IconUser } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";

export default function SignupFormDemo() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Use username for login
      const result = await login(formData.username, formData.password);
      
      if (result.error) {
        setError("نام کاربری یا کلمه عبور نادرست است.");
        setIsLoading(false);
        return;
      }

      // Redirect to next page or dashboard
      const nextPath = searchParams?.get('next') || '/';
      router.replace(nextPath);
    } catch (err) {
      setError("خطایی رخ داد. لطفاً دوباره تلاش کنید.");
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl"
      >
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            خوش آمدید
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            برای ورود، نام کاربری و کلمه عبور خود را وارد کنید
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium text-gray-700">
              نام کاربری
            </Label>
            <div className="relative">
              <IconUser className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleInputChange}
                className="pl-10"
                placeholder="نام کاربری خود را وارد کنید"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              کلمه عبور
            </Label>
            <div className="relative">
              <IconLock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleInputChange}
                className="pl-10 pr-10"
                placeholder="کلمه عبور خود را وارد کنید"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <HoverBorderGradient
            as="button"
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSubmit}
          >
            {isLoading ? "در حال ورود..." : "ورود به سامانه"}
          </HoverBorderGradient>
        </form>
      </motion.div>
    </div>
  );
}
