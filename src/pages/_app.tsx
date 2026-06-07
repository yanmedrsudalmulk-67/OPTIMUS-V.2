import type { AppProps } from "next/app";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import Head from "next/head";
import Layout from "@/components/Layout";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/store/useStore";
import "@/styles/globals.css";

function GlobalInitializer() {
  const setHospitalLogo = useStore((state) => state.setHospitalLogo);
  const setIndicatorProfiles = useStore((state) => state.setIndicatorProfiles);

  useEffect(() => {
    const savedLogo = localStorage.getItem("hospital_logo");
    if (savedLogo) {
      setHospitalLogo(savedLogo);
    }

    const loadGlobalSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("welcome_settings")
          .select("image_url")
          .eq("id", "logo")
          .single();
          
        if (data && data.image_url) {
          localStorage.setItem("hospital_logo", data.image_url);
          setHospitalLogo(data.image_url);
        }
      } catch (err) {}
    };
    loadGlobalSettings();

    // Central Data Synchronization
    const syncMasterData = async () => {
      try {
        const { data, error } = await supabase
          .from('master_indikator')
          .select('*')
          .order('created_at', { ascending: true });

        if (data && !error) {
          const adapted = data.map((d: any) => ({
            id: d.id,
            category: d.category,
            indicator_title: d.title,
            rationale: d.rationale,
            quality_dimension: d.quality_dimension,
            objective: d.purpose,
            operational_definition: d.operational_definition,
            indicator_type: d.indicator_type,
            measurement_unit: d.measurement_unit === "Rasio" ? "Indeks" : d.measurement_unit,
            numerator: d.numerator,
            denominator: d.denominator,
            target: d.target === null || d.target === undefined ? "" : String(d.target),
            criteria: d.criteria,
            formula: d.formula,
            data_collection_method: d.data_collection_method,
            data_source: d.data_source,
            sampling_method: d.sampling_method,
            data_collection_tool: d.data_collection_instrument,
            sample_size: d.sample_size,
            collection_period: d.collection_period,
            analysis_period: d.analysis_period,
            data_presentation: d.data_presentation,
            person_responsible: d.person_in_charge,
            reverse: d.reverse,
            created_at: d.created_at,
            updated_at: d.updated_at
          }));
          setIndicatorProfiles(adapted);
        }
      } catch (err) {}
    };
    syncMasterData();

    // Central Realtime Sync Channel
    const psqlChannel = supabase
      .channel("master-indikator-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "master_indikator" },
        () => {
          syncMasterData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(psqlChannel);
    };
  }, [setHospitalLogo, setIndicatorProfiles]);

  return null;
}

export default function App({ Component, pageProps, router }: AppProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <Head>
        <title>UOBK RSUD AL-MULK - Sistem Pelaporan Mutu</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <GlobalInitializer />
      <Layout router={router}>
        <Component {...pageProps} />
      </Layout>
    </QueryClientProvider>
  );
}
