import type { University } from "../types/parking";
import { Button } from "./ui/button";
import { Building2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface UniversitySelectorProps {
  universities: University[];
  onSelectUniversity: (universityId: string) => void;
}

export function UniversitySelector({ universities, onSelectUniversity }: UniversitySelectorProps) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="max-w-4xl mx-auto text-center space-y-12">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary/5 rounded-full border border-primary/20">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium">Real-Time Parking Data</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Welcome to <span className="text-primary">UniView</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Smart parking management powered by edge AI and computer vision. 
            Find available parking in real-time across your campus.
          </p>
        </motion.div>

        {/* University Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-semibold">Select Your University</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {universities.map((university, index) => (
              <motion.div
                key={university.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
              >
                <Button
                  onClick={() => onSelectUniversity(university.id)}
                  variant="outline"
                  className="h-auto w-full p-8 flex flex-col items-center gap-4 hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="p-4 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                    <Building2 className="h-10 w-10 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xl font-semibold">{university.shortName}</p>
                    <p className="text-sm text-muted-foreground">{university.name}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </Button>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Footer Info */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex items-center justify-center gap-8 text-sm text-muted-foreground pt-8"
        >
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary/10 rounded flex items-center justify-center">
              <span className="text-primary font-bold">AI</span>
            </div>
            <span>Edge AI Detection</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary/10 rounded flex items-center justify-center">
              <span className="text-primary font-bold">&lt;5%</span>
            </div>
            <span>Error Rate</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary/10 rounded flex items-center justify-center">
              <span className="text-primary font-bold">30s</span>
            </div>
            <span>Update Frequency</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
