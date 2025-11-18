import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { House, ArrowLeft, MagnifyingGlass } from '@phosphor-icons/react';
import { useNavigate, useLocation } from 'react-router-dom';

export function NotFoundPage(): JSX.Element {
    const navigate = useNavigate();
    const location = useLocation();

    const handleGoHome = (): void => {
        navigate('/');
    };

    const handleGoBack = (): void => {
        navigate(-1);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
            <div className="max-w-md w-full space-y-6 text-center">
                <div className="space-y-2">
                    <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
                    <h2 className="text-2xl font-semibold text-foreground">Page Not Found</h2>
                </div>

                <Alert>
                    <MagnifyingGlass size={20} />
                    <AlertTitle>Route not found</AlertTitle>
                    <AlertDescription>
                        The page at <code className="text-xs bg-muted px-1 py-0.5 rounded">{location.pathname}</code> does not exist.
                    </AlertDescription>
                </Alert>

                <div className="flex flex-col gap-3">
                    <Button onClick={() => void handleGoHome()} variant="default" className="w-full">
                        <House size={16} className="mr-2" />
                        Go Home
                    </Button>
                    <Button onClick={() => void handleGoBack()} variant="outline" className="w-full">
                        <ArrowLeft size={16} className="mr-2" />
                        Go Back
                    </Button>
                </div>
            </div>
        </div>
    );
}
