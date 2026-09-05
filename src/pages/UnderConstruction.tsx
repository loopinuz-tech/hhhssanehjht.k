import { Construction, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const UnderConstruction = ({ title }: { title: string }) => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-primary/5 rounded-[2rem] flex items-center justify-center mb-8 animate-pulse">
        <Construction className="w-12 h-12 text-primary" />
      </div>
      <h1 className="text-3xl font-black text-foreground mb-4">{title}</h1>
      <p className="text-muted-foreground max-w-md mx-auto mb-10 font-medium">
        Ushbu bo'lim hozirda ishlab chiqilmoqda. Tez orada barcha imkoniyatlar foydalanishga topshiriladi.
      </p>
      <Link 
        to="/tests" 
        className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
      >
        <ArrowLeft className="w-4 h-4" /> Bosh sahifaga qaytish
      </Link>
    </div>
  );
};

export default UnderConstruction;
