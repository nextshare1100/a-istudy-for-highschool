import { NextRequest, NextResponse } from "next/server";
import { getWeaknessAnalysis } from "@/lib/firebase/firestore";
import { getGeminiClient } from "@/lib/gemini/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const includeAI = searchParams.get("includeAI") === "true";
    
    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }
    
    const weaknesses = await getWeaknessAnalysis(userId);
    
    let aiAnalysis = null;
    let modelUsed = null;
    
    if (includeAI && weaknesses) {
      try {
        const client = getGeminiClient();
        
        aiAnalysis = await client.analyzeWeakness({
          userId,
          subjects: Object.keys(weaknesses),
          recentResults: weaknesses,
          timeFrame: "30days"
        });
        
        const stats = client.getModelUsageStats();
        modelUsed = stats.find(s => s.available)?.model || "none";
        
      } catch (error) {
        console.error("AI analysis error:", error);
        
        if (error.message?.includes("すべてのモデルが利用制限")) {
          console.log("AI利用制限に達しています");
        }
      }
    }
    
    return NextResponse.json({
      weaknesses,
      aiAnalysis,
      modelUsed,
      enhanced: includeAI && aiAnalysis !== null
    });
    
  } catch (error) {
    console.error("Error analyzing weaknesses:", error);
    return NextResponse.json(
      { error: "Failed to analyze weaknesses" },
      { status: 500 }
    );
  }
}
