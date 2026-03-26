interface Props {
  children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
  return (
    <div className="from-muted via-background to-muted/30 flex min-h-svh items-center justify-center bg-gradient-to-b p-6 md:p-10">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
};

export default Layout;
